/*
 * Original shader from: https://glslsandbox.com/e#75983.0
 */

#ifdef GL_ES
precision mediump float;
#endif


uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;


#define time u_time
#define resolution u_resolution
#define mouse u_resolution

// glslsandbox uniforms
// uniform float time;
// uniform vec2 resolution;





/*
 * Original shader from: https://www.shadertoy.com/view/sdyXzR
 */


// shadertoy emulation
#define iTime time
#define iResolution resolution
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float circle(vec2 pos, float rad) {
    return 1. - (length(pos) / .04);
}

float spinningCircle(vec2 uv, float rad, float offset) {
    float circleRad = .005;
    float rotationRad = rad * 2.;
    vec2 mouseOffset = iMouse.xy / (5. * iResolution.xy);
    float x = sin(iTime/6.0 + offset + mouseOffset.x) * rotationRad;
    float y = cos(iTime/5.0 + offset * .6 + mouseOffset.y) * rotationRad;
    vec2 pos = vec2(x, y);
    float circle = circle(uv - pos, circleRad);
	return map(circle, 0., 1., 0.409, 0.4999);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    const int N = 70;
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;
    float col = 1.0;
    for (int i=0; i<N; i++) {
        col /= spinningCircle(uv, float(i) / float(N), float(i));
    }
    fragColor = vec4(vec3(pow(col, 0.15), pow(col, cos(time/20.0+0.9)*0.9), pow(col, sin(time/20.0+.4)*0.1)), 3.); // HDR mod with time by Anastasiy
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}