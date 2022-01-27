//
//  ShaderRenderer.cpp
//
//  Adapted by Anastasiy Safari
//  Copyright (c) 2014, Patricio Gonzalez Vivo
//  Based on original code from:
/*

 Copyright (c) 2014, Patricio Gonzalez Vivo
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

     * Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.
     * Neither the name of the copyright holder nor the
       names of its contributors may be used to endorse or promote products
       derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 */
//

#include "ShaderRenderer.hpp"

#include <stdio.h>
#include <string>
#include <sys/stat.h>
#include <unistd.h>
#include <map>
#include <thread>
#include <mutex>
#include <atomic>
#include <iostream>
#include <fstream>
#include <GLFW/glfw3.h>

#include "ada/window.h"
#include "ada/gl/gl.h"
#include "ada/tools/fs.h"
#include "ada/tools/time.h"
#include "ada/tools/text.h"
#include "ada/shaders/defaultShaders.h"

#include "sandbox.h"
#include "types/files.h"

// Open Sound Control
#include <lo/lo_cpp.h>
std::mutex                  oscMutex;
int                         oscPort = 0;

// Here is where all the magic happens
Sandbox                     sandbox;

//  List of FILES to watch and the variable to communicate that between process
WatchFileList               files;
std::mutex                  filesMutex;
int                         fileChanged;

// Commands variables
CommandList                 commands;
std::mutex                  commandsMutex;
std::vector<std::string>    commandsArgs;    // Execute commands
bool                        commandsExit = false;

std::atomic<bool>           keepRunnig(true);
bool                        bTerminate = false;
bool                        fullFps = false;

void                        commandsRun(const std::string &_cmd);
void                        commandsRun(const std::string &_cmd, std::mutex &_mutex);

void                        fileWatcherThread();
void                        onExit();

extern "C"  {
    
void command(char* c) {
    commandsArgs.push_back( std::string(c) );
}

void setFrag(char* c) {
    sandbox.setSource(FRAGMENT, std::string(c) );
    sandbox.reloadShaders(files);
}

void setVert(char* c) {
    sandbox.setSource(VERTEX, std::string(c) );
    sandbox.reloadShaders(files);
}

char* getFrag() {
    return (char*)sandbox.getSource(FRAGMENT).c_str();
}

char* getVert() {
    return (char*)sandbox.getSource(VERTEX).c_str();
}

}

void loop() {
    ada::updateGL();

    glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

    if (!bTerminate && !fullFps && !sandbox.haveChange()) {
    // If nothing in the scene change skip the frame and try to keep it at 60fps
        std::this_thread::sleep_for(std::chrono::milliseconds( ada::getRestMs() ));
        return;
    }

    // Draw Scene
    sandbox.render();

    // Draw Cursor and 2D Debug elements
    sandbox.renderUI();

    // Finish drawing
    sandbox.renderDone();

    if ( bTerminate && sandbox.screenshotFile == "" )
        keepRunnig.store(false);
    else

    ada::renderGL();
}


using namespace std;
    
bool displayHelp = false;
bool willLoadGeometry = false;
bool willLoadTextures = false;
ada::WindowProperties window_properties;

int argc = 3;
const char* argv[] = {"","--will be replaced--","-ss",NULL};
std::string currentFragmentShaderPath;

GLFWwindow *ShaderRenderer::createWindow( std::string fragmentShaderPath, int fps ) {
        
        currentFragmentShaderPath = fragmentShaderPath;
        
        argv[1] = currentFragmentShaderPath.c_str();
    
        if (fps != -1)
        {
            ada::setFps( fps );
        }
        window_properties.style = ada::FULLSCREEN;
        //(char*)(fragmentShaderPath.c_str());

        // Set the size
        glm::ivec4 window_viewport = glm::ivec4(0);
        window_viewport.z = 512;
        window_viewport.w = 512;

        for (int i = 1; i < argc ; i++) {
            std::string argument = std::string(argv[i]);
            if ( ( ada::haveExt(argument,"ply") || ada::haveExt(argument,"PLY") ||
                        ada::haveExt(argument,"obj") || ada::haveExt(argument,"OBJ") ||
                        ada::haveExt(argument,"stl") || ada::haveExt(argument,"STL") ||
                        ada::haveExt(argument,"glb") || ada::haveExt(argument,"GLB") ||
                        ada::haveExt(argument,"gltf") || ada::haveExt(argument,"GLTF") ) ) {
                willLoadGeometry = true;
            }
            else if (   ada::haveExt(argument,"hdr") || ada::haveExt(argument,"HDR") ||
                        ada::haveExt(argument,"png") || ada::haveExt(argument,"PNG") ||
                        ada::haveExt(argument,"tga") || ada::haveExt(argument,"TGA") ||
                        ada::haveExt(argument,"psd") || ada::haveExt(argument,"PSD") ||
                        ada::haveExt(argument,"gif") || ada::haveExt(argument,"GIF") ||
                        ada::haveExt(argument,"bmp") || ada::haveExt(argument,"BMP") ||
                        ada::haveExt(argument,"jpg") || ada::haveExt(argument,"JPG") ||
                        ada::haveExt(argument,"jpeg") || ada::haveExt(argument,"JPEG") ||
                        ada::haveExt(argument,"mov") || ada::haveExt(argument,"MOV") ||
                        ada::haveExt(argument,"mp4") || ada::haveExt(argument,"MP4") ||
                        ada::haveExt(argument,"mpeg") || ada::haveExt(argument,"MPEG") ||
                        argument.rfind("/dev/", 0) == 0 ||
                        argument.rfind("http://", 0) == 0 ||
                        argument.rfind("https://", 0) == 0 ||
                        argument.rfind("rtsp://", 0) == 0 ||
                        argument.rfind("rtmp://", 0) == 0 ) {
                willLoadTextures = true;
            }
        }

        // Initialize openGL context
        GLFWwindow* window = ada::initGL (window_viewport, window_properties);

        
        // HDR old
//        glfwWindowHint(GLFW_RED_BITS, 16);
//        glfwWindowHint(GLFW_GREEN_BITS, 16);
//        glfwWindowHint(GLFW_BLUE_BITS, 16);
//
//        addAttrib(NSOpenGLPFAColorFloat);
//        setAttrib(NSOpenGLPFAColorSize, 64);


        return window;


}
    
void ShaderRenderer::startRenderer( ) {
        
    struct stat st;                         // for files to watch
    int         textureCounter  = 0;        // Number of textures to load
    bool        vFlip           = true;     // Flip state

    //Load the the resources (textures)
    for (int i = 1; i < argc ; i++){
        std::string argument = std::string(argv[i]);

        if ( sandbox.frag_index == -1 && (ada::haveExt(argument,"frag") || ada::haveExt(argument,"fs") ) ) {
            if ( stat(argument.c_str(), &st) != 0 ) {
                std::cout << "File " << argv[i] << " not founded. Creating a default fragment shader with that name"<< std::endl;

                std::ofstream out(argv[i]);
                if (willLoadGeometry)
                    out << ada::getDefaultSrc(ada::FRAG_DEFAULT_SCENE);
                else if (willLoadTextures)
                    out << ada::getDefaultSrc(ada::FRAG_DEFAULT_TEXTURE);
                else
                    out << ada::getDefaultSrc(ada::FRAG_DEFAULT);
                out.close();
            }

            WatchFile file;
            file.type = FRAG_SHADER;
            file.path = argument;
            file.lastChange = st.st_mtime;
            files.push_back(file);

            sandbox.frag_index = files.size()-1;

        }
        else if ( sandbox.vert_index == -1 && ( ada::haveExt(argument,"vert") || ada::haveExt(argument,"vs") ) ) {
            if ( stat(argument.c_str(), &st) != 0 ) {
                std::cout << "File " << argv[i] << " not founded. Creating a default vertex shader with that name"<< std::endl;

                std::ofstream out(argv[i]);
                out << ada::getDefaultSrc(ada::VERT_DEFAULT_SCENE);
                out.close();
            }

            WatchFile file;
            file.type = VERT_SHADER;
            file.path = argument;
            file.lastChange = st.st_mtime;
            files.push_back(file);

            sandbox.vert_index = files.size()-1;
        }
        else if ( sandbox.geom_index == -1 && ( ada::haveExt(argument,"ply") || ada::haveExt(argument,"PLY") ||
                                                ada::haveExt(argument,"obj") || ada::haveExt(argument,"OBJ") ||
                                                ada::haveExt(argument,"stl") || ada::haveExt(argument,"STL") ||
                                                ada::haveExt(argument,"glb") || ada::haveExt(argument,"GLB") ||
                                                ada::haveExt(argument,"gltf") || ada::haveExt(argument,"GLTF") ) ) {
            if ( stat(argument.c_str(), &st) != 0) {
                std::cerr << "Error watching file " << argument << std::endl;
            }
            else {
                WatchFile file;
                file.type = GEOMETRY;
                file.path = argument;
                file.lastChange = st.st_mtime;
                files.push_back(file);
                sandbox.geom_index = files.size()-1;
            }
        }
        else if (   ada::haveExt(argument,"hdr") || ada::haveExt(argument,"HDR") ||
                    ada::haveExt(argument,"png") || ada::haveExt(argument,"PNG") ||
                    ada::haveExt(argument,"tga") || ada::haveExt(argument,"TGA") ||
                    ada::haveExt(argument,"psd") || ada::haveExt(argument,"PSD") ||
                    ada::haveExt(argument,"gif") || ada::haveExt(argument,"GIF") ||
                    ada::haveExt(argument,"bmp") || ada::haveExt(argument,"BMP") ||
                    ada::haveExt(argument,"jpg") || ada::haveExt(argument,"JPG") ||
                    ada::haveExt(argument,"jpeg") || ada::haveExt(argument,"JPEG")) {

            if (ada::check_for_pattern(argument)) {
                if ( sandbox.uniforms.addStreamingTexture("u_tex" + ada::toString(textureCounter), argument, vFlip, false) )
                    textureCounter++;
            }
            else if ( sandbox.uniforms.addTexture("u_tex" + ada::toString(textureCounter), argument, files, vFlip) )
                textureCounter++;
        }
        else if ( argument == "--video" ) {
            if (++i < argc) {
                argument = std::string(argv[i]);
                if ( sandbox.uniforms.addStreamingTexture("u_tex" + ada::toString(textureCounter), argument, vFlip, true) )
                    textureCounter++;
            }
        }
        else if (   ada::haveExt(argument,"mov") || ada::haveExt(argument,"MOV") ||
                    ada::haveExt(argument,"mp4") || ada::haveExt(argument,"MP4") ||
                    ada::haveExt(argument,"mkv") || ada::haveExt(argument,"MKV") ||
                    ada::haveExt(argument,"mpg") || ada::haveExt(argument,"MPG") ||
                    ada::haveExt(argument,"mpeg") || ada::haveExt(argument,"MPEG") ||
                    ada::haveExt(argument,"h264") ||
                    argument.rfind("/dev/", 0) == 0 ||
                    argument.rfind("http://", 0) == 0 ||
                    argument.rfind("https://", 0) == 0 ||
                    argument.rfind("rtsp://", 0) == 0 ||
                    argument.rfind("rtmp://", 0) == 0) {
            if ( sandbox.uniforms.addStreamingTexture("u_tex" + ada::toString(textureCounter), argument, vFlip, false) )
                textureCounter++;
        }
        else if ( argument == "--audio" || argument == "-a" ) {
            std::string device_id = "-1"; //default device id
            // device_id is optional argument, not iterate yet
            if ((i + 1) < argc) {
                argument = std::string(argv[i + 1]);
                if (ada::isInt(argument)) {
                    device_id = argument;
                    i++;
                }
            }
            if ( sandbox.uniforms.addAudioTexture("u_tex" + ada::toString(textureCounter), device_id, vFlip, true) )
                textureCounter++;
        }
        else if ( argument == "-c" || argument == "-sh" ) {
            if(++i < argc) {
                argument = std::string(argv[i]);
                sandbox.uniforms.setCubeMap(argument, files);
                sandbox.getScene().showCubebox = false;
            }
            else
                std::cout << "Argument '" << argument << "' should be followed by a <environmental_map>. Skipping argument." << std::endl;
        }
        else if ( argument == "-C" ) {
            if(++i < argc)
            {
                argument = std::string(argv[i]);
                sandbox.uniforms.setCubeMap(argument, files);
                sandbox.getScene().showCubebox = true;
            }
            else
                std::cout << "Argument '" << argument << "' should be followed by a <environmental_map>. Skipping argument." << std::endl;
        }
        else if ( argument.find("-D") == 0 ) {
            // Defines are added/remove once existing shaders
            // On multiple meshes files like OBJ, there can be multiple
            // variations of meshes, that only get created after loading the sece
            // to work around that defines are add post-loading as argument commands
            std::string define = std::string("define,") + argument.substr(2);
            commandsArgs.push_back(define);
        }
        else if ( argument.find("-I") == 0 ) {
            std::string include = argument.substr(2);
            sandbox.include_folders.push_back(include);
        }
        else if ( argument.find("-") == 0 ) {
            std::string parameterPair = argument.substr( argument.find_last_of('-') + 1 );
            if(++i < argc) {
                argument = std::string(argv[i]);

                // If it's a video file, capture device, streaming url or Image sequence
                if (ada::haveExt(argument,"mov") || ada::haveExt(argument,"MOV") ||
                    ada::haveExt(argument,"mp4") || ada::haveExt(argument,"MP4") ||
                    ada::haveExt(argument,"mpeg") || ada::haveExt(argument,"MPEG") ||
                    argument.rfind("/dev/", 0) == 0 ||
                    argument.rfind("http://", 0) == 0 ||
                    argument.rfind("https://", 0) == 0 ||
                    argument.rfind("rtsp://", 0) == 0 ||
                    argument.rfind("rtmp://", 0) == 0 ||
                    ada::check_for_pattern(argument) ) {
                    sandbox.uniforms.addStreamingTexture(parameterPair, argument, vFlip, false);
                }
                // Else load it as a single texture
                else
                    sandbox.uniforms.addTexture(parameterPair, argument, files, vFlip);
            }
            else
                std::cout << "Argument '" << argument << "' should be followed by a <texture>. Skipping argument." << std::endl;
        }
    }

    // If no shader
    if ( sandbox.frag_index == -1 && sandbox.vert_index == -1 && sandbox.geom_index == -1 ) {
        onExit();
        return;
    }

    sandbox.setup(files, commands);

    ada::setWindowVSync(true);

    // Start watchers
    fileChanged = -1;
    std::thread fileWatcher( &fileWatcherThread );

    // Render Loop
    while ( ada::isGL() && keepRunnig.load() ){
        // Something change??
        if ( fileChanged != -1 ) {
            filesMutex.lock();
            sandbox.onFileChange( files, fileChanged );
            fileChanged = -1;
            filesMutex.unlock();
        }

        loop();
    }

    
    // If is terminated by the windows manager, turn keepRunnig off so the fileWatcher can stop
    if ( !ada::isGL() )
        keepRunnig.store(false);

    onExit();
    
    // Wait for watchers to end
    fileWatcher.join();


}

    // Events
    //============================================================================
    void ada::onKeyPress (int _key) {
//            keepRunnig = false;
//            keepRunnig.store(false);
    }

    void ada::onMouseMove(float _x, float _y) {
    }

    void ada::onMouseClick(float _x, float _y, int _button) { }
    void ada::onScroll(float _yoffset) { sandbox.onScroll(_yoffset); }
    void ada::onMouseDrag(float _x, float _y, int _button) { sandbox.onMouseDrag(_x, _y, _button); }
    void ada::onViewportResize(int _newWidth, int _newHeight) { sandbox.onViewportResize(_newWidth, _newHeight); }

    void commandsRun(const std::string &_cmd) { commandsRun(_cmd, commandsMutex); }
    void commandsRun(const std::string &_cmd, std::mutex &_mutex) {
        bool resolve = false;

        // Check if _cmd is present in the list of commands
        for (size_t i = 0; i < commands.size(); i++) {
            if (ada::beginsWith(_cmd, commands[i].begins_with)) {
                // Do require mutex the thread?
                if (commands[i].mutex) _mutex.lock();

                // Execute de command
                resolve = commands[i].exec(_cmd);

                if (commands[i].mutex) _mutex.unlock();

                // If got resolved stop searching
                if (resolve) break;
            }
        }

        // If nothing match maybe the user is trying to define the content of a uniform
        if (!resolve) {
            _mutex.lock();
            sandbox.uniforms.parseLine(_cmd);
            _mutex.unlock();
        }
    }

    void onExit() {
        // clear screen
        glClear( GL_COLOR_BUFFER_BIT );

        // Delete the resources of Sandbox
        sandbox.clear();

        // close openGL instance
        ada::closeGL();
    }

    //  Watching Thread
    //============================================================================
    void fileWatcherThread() {
        struct stat st;
        while ( keepRunnig.load() ) {
            for ( uint32_t i = 0; i < files.size(); i++ ) {
                if ( fileChanged == -1 ) {
                    stat( files[i].path.c_str(), &st );
                    int date = st.st_mtime;
                    if ( date != files[i].lastChange ) {
                        filesMutex.lock();
                        files[i].lastChange = date;
                        fileChanged = i;
                        filesMutex.unlock();
                    }
                }
            }
            std::this_thread::sleep_for(std::chrono::milliseconds( 500 ));
        }
    }
