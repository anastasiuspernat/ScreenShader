/*
 * Original shader from: https://www.shadertoy.com/view/NsyGWc
 */

#ifdef GL_ES
precision mediump float;
#endif


uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D   u_buffer0; // 1920x1080
varying vec2        v_texcoord; 


#define time u_time
#define resolution u_resolution

// glslsandbox uniforms
// uniform float time;
// uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution vec3(1920.0, 1080.0 * u_resolution.y/u_resolution.x , 1.)

// --------[ Original ShaderToy begins here ]---------- //
#define R(p,a,r)mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
#define H(h)cos((h)*6.3+vec3(0,23,21))*.5+.5
vec4 mainImage(vec2 C)
{
    // O=vec4(0);
    vec4 O=vec4(0);
    vec3 p,r=iResolution,
    d=normalize(vec3((C-.5*r.xy)/r.y,1));  
    float g=0.,e,s,a;
    for(float i=0.;i<99.;++i){
        p=d*g;
        p.z+=iTime*.2;
        p=R(p,vec3(1),1.2);
        p=mod(p,2.)-1.;
        // There is no basis for this line. 
        // It is written by mistake. 
        // I noticed later.
        // However, since the picture is out, it is left as it is
        p.xy=vec2(dot(p.xy,p.xy),length(p.xy)-1.);
        s=3.;
        for(int i=0;i<5;i++){
            p=vec3(10,2,1)-abs(p-vec3(10,5,1));
            s*=e=12./clamp(dot(p,p),.2,8.);
            p=abs(p)*e;
        }
        g+=e=min(length(p.xz),p.y)/s+.001;
        a=cos(i*i/80.);
        O.xyz+=mix(vec3(1),H(log(s)*.3),.5)*a*a/e*6e-5;
    }
    return pow(O,vec4(4));
 }
// --------[ Original ShaderToy ends here ]---------- //

// void main(void)
// {
//     mainImage(gl_FragColor, gl_FragCoord.xy);
//     gl_FragColor.a = 1.;
// }


void main(void) {
    vec4 color = vec4(vec3(0.0), 1.0);
    vec2 st = v_texcoord;
 
#ifdef BUFFER_0
    st.x = st.x * 1920.0 / 1080.0;
    color = mainImage(gl_FragCoord.xy);
#else
    color.rgb = texture2D(u_buffer0, st).rgb;
#endif

    gl_FragColor = color;
    gl_FragColor.a = 1.;
}