( function () {

	class Reflector extends THREE.Mesh {

		constructor( geometry, options = {} ) {

			super( geometry );
			this.type = 'Reflector';
			const scope = this;
      const patch_size = options.patch_size !== undefined ? options.patch_size : 1.0;
      console.log("HER", patch_size);

			const color = options.color !== undefined ? new THREE.Color( options.color ) : new THREE.Color( 0x7F7F7F );
			const textureWidth = options.textureWidth || 512;
			const textureHeight = options.textureHeight || 512;
			const clipBias = options.clipBias || 0;
			const shader = options.shader || Reflector.ReflectorShader; //

			const reflectorPlane = new THREE.Plane();
			const normal = new THREE.Vector3();
			const reflectorWorldPosition = new THREE.Vector3();
			const cameraWorldPosition = new THREE.Vector3();
			const rotationMatrix = new THREE.Matrix4();
			const lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
			const clipPlane = new THREE.Vector4();
			const view = new THREE.Vector3();
			const target = new THREE.Vector3();
			const q = new THREE.Vector4();
			const textureMatrix = new THREE.Matrix4();
			const virtualCamera = new THREE.PerspectiveCamera();
			const parameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat
			};
			const renderTarget = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

			if ( ! THREE.MathUtils.isPowerOfTwo( textureWidth ) || ! THREE.MathUtils.isPowerOfTwo( textureHeight ) ) {

				renderTarget.texture.generateMipmaps = false;

			}

			const material = new THREE.ShaderMaterial( {
				uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
				fragmentShader: shader.fragmentShader,
				vertexShader: shader.vertexShader
			} );
      //material.depthTest = false;

      //material.blending = THREE.CustomBlending;
      //material.blendEquation = THREE.AddEquation; //default
       //Src -> checkerboard, Dst -> mirror
      //material.blendSrc = THREE.SrcAlphaFactor; //default
      //material.blendDst = THREE.OneMinusSrcAlphaFactor; //default

      //
			material.uniforms[ 'tDiffuse' ].value = renderTarget.texture;
			material.uniforms[ 'color' ].value = color;
			material.uniforms[ 'textureMatrix' ].value = textureMatrix;
      material.uniforms['patch_size'].value = patch_size;
			this.material = material;

			this.onBeforeRender = function ( renderer, scene, camera ) {

				reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
				cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );
				rotationMatrix.extractRotation( scope.matrixWorld );
				normal.set( 0, 0, 1 );
				normal.applyMatrix4( rotationMatrix );
				view.subVectors( reflectorWorldPosition, cameraWorldPosition ); // Avoid rendering when reflector is facing away

				if ( view.dot( normal ) > 0 ) return;
				view.reflect( normal ).negate();
				view.add( reflectorWorldPosition );
				rotationMatrix.extractRotation( camera.matrixWorld );
				lookAtPosition.set( 0, 0, - 1 );
				lookAtPosition.applyMatrix4( rotationMatrix );
				lookAtPosition.add( cameraWorldPosition );
				target.subVectors( reflectorWorldPosition, lookAtPosition );
				target.reflect( normal ).negate();
				target.add( reflectorWorldPosition );
				virtualCamera.position.copy( view );
				virtualCamera.up.set( 0, 1, 0 );
				virtualCamera.up.applyMatrix4( rotationMatrix );
				virtualCamera.up.reflect( normal );
				virtualCamera.lookAt( target );
				virtualCamera.far = camera.far; // Used in WebGLBackground

				virtualCamera.updateMatrixWorld();
				virtualCamera.projectionMatrix.copy( camera.projectionMatrix ); // Update the texture matrix

				textureMatrix.set( 0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0 );
				textureMatrix.multiply( virtualCamera.projectionMatrix );
				textureMatrix.multiply( virtualCamera.matrixWorldInverse );
				textureMatrix.multiply( scope.matrixWorld ); // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
				// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf

				reflectorPlane.setFromNormalAndCoplanarPoint( normal, reflectorWorldPosition );
				reflectorPlane.applyMatrix4( virtualCamera.matrixWorldInverse );
				clipPlane.set( reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant );
				const projectionMatrix = virtualCamera.projectionMatrix;
				q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
				q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
				q.z = - 1.0;
				q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ]; // Calculate the scaled plane vector

				clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) ); // Replacing the third row of the projection matrix

				projectionMatrix.elements[ 2 ] = clipPlane.x;
				projectionMatrix.elements[ 6 ] = clipPlane.y;
				projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
				projectionMatrix.elements[ 14 ] = clipPlane.w; // Render

				renderTarget.texture.encoding = renderer.outputEncoding;
				scope.visible = false;
				const currentRenderTarget = renderer.getRenderTarget();
				const currentXrEnabled = renderer.xr.enabled;
				const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
				renderer.xr.enabled = false; // Avoid camera modification

				renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

				renderer.setRenderTarget( renderTarget );
				renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897

				if ( renderer.autoClear === false ) renderer.clear();
				renderer.render( scene, virtualCamera );
				renderer.xr.enabled = currentXrEnabled;
				renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
				renderer.setRenderTarget( currentRenderTarget ); // Restore viewport

				const viewport = camera.viewport;
				if ( viewport !== undefined ) {
					renderer.state.viewport( viewport );
				}

				scope.visible = true;

			};

			this.getRenderTarget = function () {

				return renderTarget;

			};

		}

	}

	Reflector.prototype.isReflector = true;
	Reflector.ReflectorShader = {
		uniforms: {
			'color': {
				value: null
			},
			'tDiffuse': {
				value: null
			},
			'textureMatrix': {
				value: null
			},
      'patch_size' : {value: null}
		},
		vertexShader:
  /* glsl */
  `
		uniform mat4 textureMatrix;
		varying vec4 vUv;
    varying vec3 vPos;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

      vPos = position; 
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

			#include <logdepthbuf_vertex>

		}`,
		fragmentShader:
  /* glsl */
  `
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;
		varying vec3 vPos;
    uniform float patch_size;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
      int tx = int(mod(vPos.x  / patch_size, 2.0));
      int ty = int(mod(vPos.y  / patch_size, 2.0));

      vec3 col;
      float r;
      if ((tx ^ ty) == 0) {
        r = 0.8;
      } else {
        r = 0.3;
      }
      vec3 out_color = base.rgb;

      float pw = 1.0;
      gl_FragColor = vec4(
        min(pw * base.r, 1.0) * (1.0 - r) + r, 
        min(pw * base.g, 1.0) * (1.0 - r) + r, 
        min(pw * base.b, 1.0) * (1.0 - r) + r, 1.0);

		}`
	};

	THREE.Reflector = Reflector;

} )();
