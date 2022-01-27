/*
 * Original shader from: https://glslsandbox.com/e#76011.4
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





float n(float t){
	return fract(sin(t*3456.)*5647.);
}

vec4 n4(float t){
	return fract(sin(t*vec4(3456.,1234.,3548.,3214.))*vec4(5647.,345.,8771.,9852.));
}


struct ray{
	vec3 o,d;
};

	ray getRay(vec2 uv,vec3 campos,vec3 lookat,float zoom){
		ray a;
		a.o = campos;
		
		vec3 f = normalize(lookat-campos);
		vec3 r = cross(vec3(0.,1.,0.),f);
		vec3 u = cross(f,r);
		vec3 c = a.o+f*zoom;
		vec3 i = c+uv.x*r+uv.y*u;
		a.d = normalize(i-a.o);
		return a;
	}
vec3 closestPoint(ray r,vec3 p){
	return r.o + max(0.,dot(p-r.o,r.d)) * r.d;
}

float distRay(ray r,vec3 p){
	return length(p-closestPoint(r,p));
}

float bokeh(ray r,vec3 p,float size,float blur){
	float d = distRay(r,p);
	
	size*=length(p);
	float col = smoothstep(size,size*(1.-blur),d);
	col*=mix(.6,1.,smoothstep(size*.8,size,d));
	return col;
}

vec3 streetLights(ray r){
	float side = step(r.d.x,0.0);
	r.d.x = abs(r.d.x);
	const float s = 1./10.;
	float m = 0.;
	for(float i=0.;i<1.;i+=s){
		float ti = fract(time*.1+i+side*s*.5);
		vec3 p = vec3(2.,2.,100.-ti*100.);
		m += bokeh(r,p,.05,.1)*ti*ti*ti;
	}
	
	return vec3(1.,.7,.3)*m;
}

vec3 envLights(ray r){
	float side = step(r.d.x,0.0);
	r.d.x = abs(r.d.x);
	const float s = 1./10.;
	vec3 c = vec3(0.);
	for(float i=0.;i<1.;i+=s){
		float ti = fract(time*.1+i+side*s*.5);
		vec4 n = n4(i+side*100.);
		
		float fade = ti*ti*ti;
		float occlusion = sin(ti*10.*6.28*n.x)*.5+.5;
		fade = occlusion;
		float x = mix(2.5,10.,n.x);
		float y = mix(.1,1.5,n.y);
		
		vec3 p = vec3(x,y,50.-ti*50.);
		
		vec3 col = n.wzy;
		c += bokeh(r,p,.05,.1)*fade*col*.5;
	}
	
	return c;
}

vec3 headLights(ray r){
	const float s = 1./30.;
	float m = 0.;
	for(float i=0.;i<1.;i+=s){
		float w1 = .25;
		float w2 = w1*1.2;
		if(n(i)>.1) continue;
		float ti = fract(time*.1*2.+i);
		float z = 100.-ti*100.;
		float fade = ti*ti*ti*ti*ti;
		float focus = smoothstep(.9,1.,ti);
		float size = mix(.05,.03,focus);
		m += bokeh(r,vec3(-1.-w1,.15,z),size,.1)*fade;
		m += bokeh(r,vec3(-1.+w1,.15,z),size,.1)*fade;
		
		m += bokeh(r,vec3(-1.-w2,.15,z),size,.1)*fade;
		m += bokeh(r,vec3(-1.+w2,.15,z),size,.1)*fade;
		
		float ref = 0.;
		ref += bokeh(r,vec3(-1.-w2,-.15,z),size*3.,1.)*fade;
		ref += bokeh(r,vec3(-1.+w2,-.15,z),size*3.,1.)*fade;
		
		m+=ref*focus;
	}
	
	return vec3(.9,.9,1.)*m;
}

vec3 tailLights(ray r){
	const float s = 1./15.;
	float m = 0.;
	for(float i=0.;i<1.;i+=s){
		float w1 = .25;
		float w2 = w1*1.2;
		if(n(i)>.5) continue;
		float lane = step(.25,n(i));
		float ti = fract(time*.1*.25+i);
		float z = 100.-ti*100.;
		float fade = ti*ti*ti*ti*ti;
		float focus = smoothstep(.9,1.,ti);
		float size = mix(.05,.03,focus);
		float laneShift = smoothstep(1.,.97,ti);
		float x = 1.5-lane*laneShift;
		
		float blink = step(0.,sin(time*20.))*7.*lane*step(.95,ti);
		
		m += bokeh(r,vec3(x-w1,.15,z),size,.1)*fade;
		m += bokeh(r,vec3(x+w1,.15,z),size,.1)*fade;
		
		m += bokeh(r,vec3(x-w2,.15,z),size,.1)*fade;
		m += bokeh(r,vec3(x+w2,.15,z),size,.1)*fade*(1.+blink);
		
		float ref = 0.;
		ref += bokeh(r,vec3(x-w2,-.15,z),size*3.,1.)*fade;
		ref += bokeh(r,vec3(x+w2,-.15,z),size*3.,1.)*fade*(1.+blink*.1);
		
		m+=ref*focus;
	}
	
	return vec3(1.,.1,.03)*m;
}

vec2 rain(vec2 uv,float t){
	t*=2.;
	vec2 a = vec2(3.,1.);
	vec2 st = uv*a;
	
	vec2 id = floor(st);
	st.y+=t*.22;
	float n = fract(sin(id.x*754.35)*1368.31);
	st.y+=n;
	uv.y+=n;
	
	st.t+=fract(sin(id.x*1234.35)*4568.31);
	id = floor(st);
	st = fract(st)-.5;
	
	t += fract(sin(id.x*73.48+id.y*1528.67)*768.35)*6.283;
	float y = -sin(t+sin(t+sin(t)*.5))*.43;
	vec2 p1 = vec2(0.,y);
	
	vec2 o1 = (st-p1)/a;
	float d = length(o1);
	float m1 = smoothstep(.07,.0,d);
	
	vec2 o2 = (fract(uv*a.x*vec2(1.,2.))-.5)/vec2(1.,2.);
	d = length(o2);
	float m2 = smoothstep(.3*(.5-st.y),.0,d)*smoothstep(-.5,1.,st.y-p1.y);
	//if(st.x>.46||st.y>.49) m1 = 1.;
	return vec2(m1*o1*20.+m2*o2*5.);
}

void main( void ) {
	vec2 uv = gl_FragCoord.xy/resolution;
	uv-=.5;
	uv.x *= resolution.x/resolution.y;
	vec3 campos = vec3(.5,.2,0.);
	vec3 lookat = vec3(.5,.2,1.);
	
	vec2 rainDistort = rain(uv*5.,time)*.5;
	rainDistort += rain(uv*7.,time)*.5;
	
	uv.x+=sin(uv.y*70.)*.003;
	uv.y+=sin(uv.x*170.)*.001;
	ray r = getRay(uv-rainDistort*.5,campos,lookat,1.5);
	
	vec3 col = streetLights(r);
	col += headLights(r);
	col += tailLights(r);
	col += envLights(r);
	
	col += (r.d.y+.25)*vec3(.2,.1,.5);
	
	//col = vec3(rainDistort,0.);
	
	gl_FragColor = vec4(col,1.);

}