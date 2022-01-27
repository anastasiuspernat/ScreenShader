/*
 * Original shader from: https://glslsandbox.com/e#76610.0
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



#define PI 3.1415926538


//uniform vec2 mouse;

void main( void ) {

	vec2 pos = ( gl_FragCoord.xy - resolution / 2.0) / resolution.y;
	//if (intensity > 0.99)
	
	float angle = acos(dot(vec2(0.0, 1.0), normalize(pos))) * sign(pos.x) / PI * 1.0 + time / 1.0;
	float koef = (sin(time + length(pos)) * 0.5 + 0.5) * 0.5 + 0.5;
	float intensity = 1.0 - mod(length(pos) * koef * 40.0 + angle, 1.0);
	
	vec3 col = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), length(pos));
	//	col = vec3(0.0,11111111111111111111111111111111111111111111111111111111111111111111111111.0,0.0);
	gl_FragColor = vec4( col * intensity, 3.0 );
}