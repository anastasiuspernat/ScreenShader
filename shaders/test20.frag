/*
 * Original shader from: https://www.shadertoy.com/view/sldXDM
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D   u_buffer0; // 512x512
uniform vec2        u_resolution;
uniform float       u_time;

varying vec2        v_texcoord; 

// shadertoy emulation
#define iTime u_time
#define iResolution vec3(1920.0, 1080.0 * u_resolution.y/u_resolution.x , 1.)

// --------[ Original ShaderToy begins here ]---------- //
#define R(p,a,t) mix(a*dot(p,a),p,cos(t))+sin(t)*cross(p,a)
#define H(h) (cos((h)*6.3+vec3(0.0,23.0,21.0))*.5+.5)

vec3 mainImage(vec2 st) {
    vec3 p = vec3(0.0);
    vec3 r = iResolution;
    vec3 c =vec3(0.0);
    vec3 d = normalize(vec3(st-.5, 1.0));
    float s,e,g=0.,t=iTime;

	for (int i = 0; i<50; ++i) {
        p = g*d;
        p.z -= -t*2.;
        p = R(p,vec3(.577),clamp(sin(t * 0.25) * 6., -.5, .5) + .6);
        p = asin(sin(p));
        vec4 q = vec4(p, 0.0);
        s = 2.0;
        for (int i = 0; i < 4; ++i) {
            q = abs(q);
            q = q.x < q.y ? q.zwxy : q.zwyx;
            s *= e = 11./clamp(dot(q,q),.2,9.);
            q = q*e-vec4(6);
        }
        g += e = abs(length(q.y)/s)+.002;
        c += ( H(log(s)*.3+.5) + .5 ) * 8e-5/e * 3.0; // 3.0 is HDR  
    }
    // c *= c*c;
    return c;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void) {
    vec4 color = vec4(vec3(0.0), 1.0);
    vec2 st = v_texcoord;
 
#ifdef BUFFER_0
    st.x = st.x * 1920.0 / 1080.0;
    color.rgb = mainImage(st);
#else
    color.rgb = texture2D(u_buffer0, st).rgb;
#endif

    gl_FragColor = color;
}