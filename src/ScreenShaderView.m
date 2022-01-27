//
//  glglScreensaver2View.m
//  glglScreensaver2
//
//  Created by Anastasy on 1/18/22.
//


#import "ScreenShaderView.h"
#include "GLSLView.h"


@implementation ScreenShaderView

- (instancetype)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview
{
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
        [self setAnimationTimeInterval:1/30.0];
    }
    return self;
}

- (void)startAnimation
{
    // Here we create a GLFW Window and insert it into our view
    GLSLView *glslView = [[GLSLView alloc] init];
    [glslView activateOnToView:self];
    [super startAnimation];
}

- (void)stopAnimation
{
    [super stopAnimation];
}

- (void)drawRect:(NSRect)rect
{
    [super drawRect:rect];
}

- (void)animateOneFrame
{
    return;
}

- (BOOL)hasConfigureSheet
{
    return NO;
}

- (NSWindow*)configureSheet
{
    return nil;
}

@end
