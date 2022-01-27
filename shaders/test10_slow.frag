/*
 * Original shader from: https://glslsandbox.com/e#75587.0
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
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
// "RayMarching starting point" 
// by Martijn Steinrucken aka The Art of Code/BigWings - 2020
// The MIT License
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Email: countfrolic@gmail.com
// Twitter: @The_ArtOfCode
// YouTube: youtube.com/TheArtOfCodeIsCool
// Facebook: https://www.facebook.com/groups/theartofcode/
//
// You can use this shader as a template for ray marching shaders

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

#define S smoothstep
#define T iTime

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 s) {
    p = abs(p)-s;
	return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}


float GetDist(vec3 p) {
    p.y *= 0.8;
    float a = atan(p.z,p.x);
    float r1 = 1.;
    float r2 = 0.5;
    float d = length(p.xz) - r1;
    d *= (0.95-0.5 * d);
    float td = length(vec2(cos(5. * min(abs(p.x),abs(p.z))) + p.y + cos(5.* p.y+2.*a+ 2.*iTime),4. * d)) - r2;
    
    return td * 0.18;
  
}

float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }
    
    return dO;
}

vec3 GetNormal(vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i);
    return d;
}

vec3 Bg(vec3 rd) {
    float a = atan(rd.z, rd.x);
    float k = mix(rd.y , cos(a), .5 + .5 * cos(2. * iTime)) * .5 + .5;
    vec3 col = mix(vec3(.5,0.05,0.02),vec3(0.),k);
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
	vec2 m = iMouse.xy/iResolution.xy;

    //vec3 ro = vec3(3.5, 2., 3.5);
    vec3 ro = vec3(2.5 * cos(0.1 * iTime ),2. * sin(0.5 * iTime), 2.5 * sin(0.1 * iTime));
   // ro.yz *= Rot(-m.y*3.14+1.);
    //ro.xz *= Rot(-m.x*6.2831);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.);
    vec3 col = vec3(0);
    col += Bg(rd);
   
    float d = RayMarch(ro, rd);
    float depth = 0.6; //1.5 + cos(iTime);
    
    // comment / uncomment me
    d = RayMarch(ro + rd * (1. + depth) * d, -0.5 * depth * rd);
    
    if(d<MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(1.5*rd, n);
        
        float spec = pow(max(0., -r.y),32.);
        spec = .5 + .5 * cos(0.00001*spec); // <-- absolute fudge but works alright
        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
        float a = atan(p.x,p.z);
        // dif = 16. * dif * dif * (1.-dif) * (1.-dif);
       
        col = 0.4 * vec3(dif) + 1.5 * cos(2. * a) * Bg(r);        
        col *= (1. + spec);
       
        // comment / uncomment me
        //col = vec3(dif);
    }
    col = pow(col, vec3(.4545));	// gamma correction
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}