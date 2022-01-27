/*
 * Based on: https://glslsandbox.com/e#8067.3
 * Leveled up by Anastasiy
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


const float Pi = 3.14159;

float sinApprox(float x) {
    x = Pi + (2.0 * Pi) * floor(x / (2.0 * Pi)) - x;
    return (4.0 / Pi) * x - (4.0 / Pi / Pi) * x * abs(x);
}

float cosApprox(float x) {
    return sinApprox(x + 0.5 * Pi);
}

void main()
{
	vec2 p=(2.0*gl_FragCoord.xy-resolution)/max(resolution.x,resolution.y);
	for(int i=1;i<30;i++)
	{
		vec2 newp=p;
		newp.x+=0.6/float(i)*sin(float(i)*p.y+time+0.3*float(i))+1.0;
		newp.y+=0.6/float(i)*sin(float(i)*p.x+time+0.3*float(i+10))-1.4;
		p=newp;
	}
	vec3 col=log(vec3(0.9*sin(3.0*p.x)+0.5,0.5*sin(3.0*p.y)+0.5,sin(p.x+p.y)))*20000.0;
	gl_FragColor=vec4(col, 1.0);
}
