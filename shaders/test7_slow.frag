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
#define mouse u_time

// glslsandbox uniforms
// uniform float time;
// uniform vec2 resolution;


// shadertoy emulation
#define iTime time
#define iResolution resolution
vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
// Fork of "Taste of Noise 3" by leon. https://shadertoy.com/view/fsdXWX
// 2021-10-13 08:52:47


// taste of noise 3 by leon denise 2021/10/12
// result of experimentation with organic patterns
// using code from Inigo Quilez, David Hoskins and NuSan
// licensed under hippie love conspiracy


// Dave Hoskins
// https://www.shadertoy.com/view/4djSRW
float hash13(vec3 p3)
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}
vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}


// Inigo Quilez
// https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float smin( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }
float smoothing(float d1, float d2, float k) { return clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 ); }
float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// rotation matrix
mat2 rot(float a) { return mat2(cos(a),-sin(a),sin(a),cos(a)); }

#define repeat(p,r) (mod(p,r)-r/2.)

// global variable
float material = 0.;
float rng;

// sdf
float map (vec3 p)
{
    vec3 pp = p;
    
    // time
    float t = iTime;
    
    // rotation parameter
    vec3 angle = vec3(4.,3.,1.+t*0.1+p.z*0.3);
    
    //angle.z += t*0.5;
    //float loop = fract(t/10.)*6.28;

    float wave = 1.0 * 0.2 * (length(p)+2.);
    
    // kif
    const int count = 8;
    float a = 1.0;
    float scene = 1000.;
    float shape = 1000.;
    for (int index = 0; index < count; ++index)
    {
        
        // fold
        p.xz = abs(p.xz)-(.6+wave)*a;
        
        // rotate
        p.xz *= rot(angle.y/a);
        p.yz *= rot(angle.x/a);
        p.yx *= rot(angle.z/a);//+loop);
        
        // sphere
        shape = length(p)-0.4*a;
        //shape = sdBox(p, vec3(.3,0.1,.3)*a);
        
        // material blending
        material = mix(material, float(index), smoothing(shape, scene, 0.3*a));
        //material = shape < scene ? float(index) : material;
        
        // add
        scene = smin(scene, shape, 0.2*a);
        
        // falloff
        a /= 1.7;
    }
        
    return scene;
}

// return color from pixel coordinate
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // reset color
    fragColor = vec4(0,0,0,1);
    material = 0.0;
    
    // camera coordinates
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    vec3 eye = vec3(0,0,-4.);
    vec2 mouse = iMouse.xy / iResolution.xy / 200.0;
    eye.yz *= rot(0.5+mouse.x*3.);
    eye.xy *= rot(0.5-mouse.y*3.);
    vec3 z = normalize(-eye);
    vec3 x = normalize(cross(z, vec3(0,1,0)));
    vec3 y = normalize(cross(x, z));
    vec3 ray = normalize(vec3(z * 1.5 + uv.x * x + uv.y * y));
    vec3 pos = eye;
    
    // white noise
    vec3 seed = vec3(gl_FragCoord.xy, iTime);
    rng = hash13(seed);
    
    // raymarch
    const int steps = 20;
    for (int index = steps; index > 0; --index)
    {
        // volume estimation
        float dist = map(pos);
        if (dist < 0.01)
        {
            float shade = float(index)/float(steps);
            
            // compute normal by NuSan (https://www.shadertoy.com/view/3sBGzV)
            vec2 off=vec2(.001,0);
            vec3 normal = normalize(map(pos)-vec3(map(pos-off.xyy), map(pos-off.yxy), map(pos-off.yyx)));
            
            // Inigo Quilez color palette (https://iquilezles.org/www/articles/palettes/palettes.htm)
            vec3 tint = vec3(.5)+vec3(.5)*cos(vec3(3,1,2)+material*.5+length(pos)*5.+iTime.t);
            
            // lighting
            float ld = dot(reflect(ray, normal), vec3(0,1,0))*0.5+0.5;
            vec3 light = vec3(1.000,1.000,1.000) * pow(ld, 2.) * 1.5; // was 0.5 here, added 1.5 for HDR
            ld = dot(reflect(ray, normal), vec3(0,-1,0))*0.5+1.5; // was +0.5 here, added 1.5 for HDR
            light += vec3(0.859,0.122,0.455) * pow(ld, 0.5)*.5;
            
            // pixel color
            fragColor.rgb = (tint + light) * shade * 1.0;
            
            break;
        }
        
        // dithering
        dist *= 0.9 + 0.1 * rng;
        
        // raymarch
        pos += ray * dist;
    }
}


// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0., 0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}