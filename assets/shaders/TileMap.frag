precision mediump float;

uniform vec2 tileIndices;
uniform vec2 tileDimension;
uniform vec2 resolution;
uniform sampler2D iChannel0;

//varying vec2 v_vTexcoord;
//varying vec4 v_vColour;

varying vec2 vTextureCoord;
varying vec4 vColor;

//varying vec2 custom_FragCoord;

float threshold(float x);


void main( void ) {
    vec2 bottomLeft = tileIndices.xy * tileDimension.xy;
    vec2 uv = bottomLeft;
    //uv.x += vTextureCoord.x * tileDimension.x;/// .25;// / resolution.xy;
    //uv.y -= vTextureCoord.y * tileDimension.y;// / .25;// / resolution.xy;
    uv.x = vTextureCoord.x;
    uv.y = vTextureCoord.y;
    // uv = uv * 3.0;
    // vec2 thing = vec2(0.0, 0.0);
    vec4 texColor = texture2D(iChannel0, uv);
    gl_FragColor = texColor;
    //gl_FragColor = vec4(1.0-uv., 1.0-uv.y, 0, 1.0);
    //gl_FragColor = vec4(vTextureCoord.x, vTextureCoord.y, 0, 1.0);
    gl_FragColor = vec4(threshold(vTextureCoord.x), threshold(vTextureCoord.y), 0, 1.0);
}

float threshold(float x) {
  if(x < 0.25) {
    return 0.0;
  }else if (x < 0.5){
    return 0.25;
  }else if(x < 0.75) {
    return 0.5;
  }else if (x < 0.95){
    return 0.75;
  }else{
    return 1.0;
  }
}
