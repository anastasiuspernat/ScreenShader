//
//  glslBridge.hpp
//  glglScreensaver2
//
//  Created by Anastasy on 1/18/22.
//

#ifndef glslBridge_hpp
#define glslBridge_hpp
#pragma once
#include <stdio.h>
#include <string>
#include <GLFW/glfw3.h>




class ShaderRenderer {
public:
    GLFWwindow *createWindow( std::string fragmentShaderPath, int fps );
    void startRenderer();
};

#endif /* glslBridge_hpp */
