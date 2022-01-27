//
//  GLSLView.mm
//
//  Created by Anastasiy on 1/18/22.
//

#import <Foundation/Foundation.h>

#include <GLFW/glfw3.h>
#define GLFW_EXPOSE_NATIVE_COCOA
#include <GLFW/glfw3native.h>

#import "GLSLView.h"
#include "ShaderRenderer.hpp"
#include <unistd.h>
#include <sys/types.h>
#include <pwd.h>
#include <assert.h>

// This is the main view that displays a shader
// It's actually a GLFW Window

@implementation GLSLView
- (void)activateOnToView:(NSView *)myView{

    ShaderRenderer shaderRenderer;

    // This is where we look for fragment shaders
    // Needs a trailing / !
    char *realHome = getpwuid(getuid())->pw_dir;
    NSString *docPath = [NSString stringWithFormat:@"%@/%@",[NSString stringWithUTF8String:realHome], @"Documents/shaders/"];

    // Get random file from that folder
    NSDirectoryEnumerator *dirEnum = [[NSFileManager defaultManager] enumeratorAtPath:docPath];
    NSString *filename;
    NSMutableArray *array = [[NSMutableArray alloc] init];
    while ((filename = [dirEnum nextObject])) {
        if ([[filename pathExtension] isEqualToString:@"frag"])
        {
            [array addObject:filename];
        }
    }
    unsigned int fileNumber = arc4random_uniform([array count]-1);
    filename = [NSString stringWithFormat:@"%@%@",docPath,[array objectAtIndex:fileNumber]];
    
    // Now if filename contains "slow" or "medium" then modify fps
    int fps = -1;
    
    if ([filename containsString:@"medium"])
    {
        fps = 50;
    }

    if ([filename containsString:@"slow"])
    {
        fps = 12;
    }

    // Now we create a window to render contents of the shader to
    GLFWwindow* window = shaderRenderer.createWindow(std::string([filename UTF8String]),fps);//"/Users/Anastasy/Projects/Programming/GLSL/screensavers/test4.frag");
    // Then we get native pointer to the window
    NSWindow* wnd = glfwGetCocoaWindow(window);
    // Get native view
    NSView* glView = [wnd contentView];
    // And add the view as a subview to the screensaver
    [myView addSubview:glView];
    // Rock on! This starts an endless loop that can be broken by keyboard or mouse
    shaderRenderer.startRenderer();

}
@end
