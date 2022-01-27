/*
 * Original shader from: https://glslsandbox.com/e#77762.0
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

// 1D random numbers
float rand(float n)
{
    return fract(sin(n) * 43758.5453123);
}

// 2D random numbers
vec2 rand2(in vec2 p)
{
	return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}

// 1D noise
float noise1(float p)
{
	float fl = floor(p);
	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

// voronoi distance noise, based on iq's articles
float voronoi(in vec2 x)
{
	vec2 p = floor(x);
	vec2 f = fract(x);
	
	vec2 res = vec2(8.0);
	for(int j = -1; j <= 1; j ++)
	{
		for(int i = -1; i <= 1; i ++)
		{
			vec2 b = vec2(i, j);
			vec2 r = vec2(b) - f + rand2(p + b);
			
			// chebyshev distance, one of many ways to do this
			float d = max(abs(r.x), abs(r.y));
			
			if(d < res.x)
			{
				res.y = res.x;
				res.x = d;
			}
			else if(d < res.y)
			{
				res.y = d;
			}
		}
	}
	return res.y - res.x;
}

float ring(in vec2 pos, float _min, float _max, float lines, float thick, float rot)
{
    float ang = atan(pos.y, pos.x) + rot;
    float wrapped = fract(mod((ang / 3.14159265359), 1.0) * lines);
    float v = 4.0*smoothstep(0.0, thick, wrapped) * smoothstep(thick, 0.0, wrapped);
    
    float d = length(pos);
    
    
    v = (v * step(_min, d) * (1.0 - step(_max, d)));
    return pow(v, 0.4);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float flicker = noise1(iTime * 2.0) * 0.8 + 0.4;

    vec2 uv = fragCoord.xy / iResolution.xy;
	uv = (uv - 0.5) * 2.0;
	vec2 suv = uv;
	uv.x *= iResolution.x / iResolution.y;
    
    float amp1 = 1.0 - voronoi(uv + vec2(iTime*0.1, 0.0));
    float amp2 = 1.0 - voronoi(uv * 2.5 + vec2(4.5 + - iTime*0.05, 5.5 - iTime*0.1));
    

    
    
    amp1 = 2.0*smoothstep(0.945, 0.99, amp1) * smoothstep(0.99, 0.945, amp1) + 3.0*smoothstep(0.84, 0.86, amp1)*smoothstep(0.86, 0.840, amp1) +
        + 2.0*smoothstep(0.74, 0.76, amp1)*smoothstep(0.76, 0.740, amp1);
    amp2 = 0.25*smoothstep(0.95, 1.0, amp2) + 1.5*smoothstep(0.74, 0.76, amp2)*smoothstep(0.76, 0.740, amp2);
	amp2 *= 2.0;
    amp2 += 0.5;
    
  
    // uncomment for weird mode
    
    /*
    uv.x += 0.1*sin(iTime*0.34) * cos(iTime*0.11313);

    uv.y += 0.8 * abs(uv.x) * max(suv.y, 0.0);
   	uv.y = uv.y * uv.y * 1.2;
    */
    
    // weird mode option 2
    //uv.xy *= uv.xy;

    float rings = 0.5 * ring(uv + vec2(sin(iTime*1.3513)*sin(iTime*2.)*0.01, (sin(iTime*1.33)*0.05)), 0.1, 0.35, 5. + floor(15.*rand(floor(sin(15.0 * iTime)))), 0.2, sin(iTime*0.5)  * noise1(10.0 * iTime) ) +
            ring(uv, 0.5, 0.80, 11.0, 0.17, -iTime * 0.25) +
        ring(uv, 0.7, 0.95, 3.0, 0.67 * abs(noise1(4.0 * iTime)), sin(iTime * 2.335) * noise1(4.0 * iTime) )
        ;
    

        
        
    rings *= 2.0;
    // vignetting
    vec2 sc = (fragCoord.xy/iResolution.xy)*2.-1.;
    float vign = (1.1-.5*dot(sc.xy,sc.xy));
    float midShad = length(uv) * 0.5;
    midShad *= midShad;
    vec4 col = vec4(0.0, 0.6, 0.9, 1.0);
    //col = vec4(1.0, 0.2, 0.2, 1.0);
    fragColor = col * (18.0*amp1*amp1 * amp2 * midShad ) * vign * vign * 3.0; // 3.0 is HDR mod by Anastasiy
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}