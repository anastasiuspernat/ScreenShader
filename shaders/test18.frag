/*
 * Based on: https://www.shadertoy.com/view/7tGXWV
 */

#ifdef GL_ES
precision mediump float;
#endif


uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;


#define time u_time
#define resolution u_resolution
#define mouse u_mouse/100.0

// glslsandbox uniforms
// uniform float time;
// uniform vec2 resolution;


void main( void ) 
{


    vec2 u = gl_FragCoord.xy / resolution.y - .5;
    vec4 o = vec4(0, 0, .1, 1);
    float r, h = 1e2, l = length(u), t = time*1.0; 
	
    for (float i=0.0;i<1.0;i+=0.02)
    {
        r = fract(h * sin(h * ceil(t + h * atan(u.x, u.y) * i) + i));
        o += vec4(6e-3 > abs(l - i) && i < r) * cos(vec4(i - h, l * r - h, l * r, 10) * 16. - t ); // -t ));
    }
	
    gl_FragColor = o;


}