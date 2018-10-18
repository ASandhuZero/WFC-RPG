precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterArea;

vec2 mapCoord(vec2);
vec2 unmapCoord(vec2);

void main(void) {

	vec4 texColor = texture2D(uSampler, vTextureCoord);

	vec2 coord = mapCoord(vTextureCoord);
	coord = unmapCoord(coord);

	if (coord.x < 0.1) {
		texColor = vec4(.5, .50, .50, 1.0);
	}
	if (coord.x > 0.7) {
		texColor = vec4(.50, .50, .50, 1.0);
	}
	if (coord.y < 0.1) {
		texColor = vec4(.50, .50, .50, 1.0);
	}
	if (coord.y > 0.9) {
		texColor = vec4(.50, .50, .50, 1.0);
	}
	gl_FragColor = texColor;
}

vec2 mapCoord( vec2 coord )
{
    coord *= filterArea.xy;
    coord += filterArea.zw;

    return coord;
}

vec2 unmapCoord( vec2 coord )
{
    coord -= filterArea.zw;
    coord /= filterArea.xy;

    return coord;
}
