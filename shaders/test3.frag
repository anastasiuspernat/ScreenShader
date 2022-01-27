/*
 * Original shader from: https://www.shadertoy.com/view/stdSDf
 */

#ifdef GL_ES
precision mediump float;
#endif


uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;


#define time u_time
#define resolution u_resolution

// glslsandbox uniforms
// uniform float time;
// uniform vec2 resolution;


// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord/iResolution.xy - 0.5;
    uv.x /= iResolution.y/iResolution.x;
    float d = length(uv) * 10.0;
    float i = floor(d);
    float n = 1.0;
    d = mod(d, n);
    float a = smoothstep(0.10, 0.15, d) - smoothstep(0.90, 0.95, d);
    float angle = atan(uv.y, uv.x) + i;
    float shade = 0.5 + 0.8 * smoothstep(0.10, 0.90, d);
    float off = (0.01 + n * 1.5);
    float aa = mod(angle * (2.0 + i) + n - iTime * off, 3.14159);
    float clip = smoothstep(0.10, 1.50, aa) - smoothstep(2.20, 2.25, aa);
    float glow = smoothstep(1.20, 2.20, aa) - smoothstep(2.20, 2.25, aa);
    
    fragColor = vec4(
      (sin(angle + vec3(0.0, 1.2, 3.2) + iTime) * 0.5 * shade + 0.5) * a * clip + 
       a * glow * glow * 0.5, 1.0
    );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}