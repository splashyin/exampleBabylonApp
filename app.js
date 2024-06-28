// Get the canvas element
const canvas = document.getElementById('renderCanvas');

var hk;

var playerBody, playerSprite;
var playerAggregate;
// Just to test
var groundAggregate;

var firstPlatform;
var canJump = true;
var canChangeDirection= false;

var light;

let createPlatform;

var gameLoop = function( engine ) 
{
    engine.runRenderLoop( function() {

        // Update player sprite position based on physics body
        playerSprite.position.x = playerBody.position.x;
        playerSprite.position.y = playerBody.position.y;

        if (playerBody.position.y <= firstPlatform.position.y - 1) {
            alert('Game Over');
            engine.stopRenderLoop();

            // Reload to restart the game
            window.location.reload();
        }

        hk.onCollisionObservable.add((ev) => {
            if (ev.type === "COLLISION_STARTED" )
            { 
                const playerPosition = playerBody.getAbsolutePosition();
                const platformPosition = ev.collidedAgainst.transformNode.getAbsolutePosition();

                // Calculate collision vector from player to platform
                const collisionVector = platformPosition.subtract(playerPosition);
                collisionVector.normalize();

                // console.log(collisionVector.y);

                // Check if collision vector points upwards (adjust threshold as needed)
                if (collisionVector.y < 0)
                    playerAggregate.body.setLinearVelocity(new BABYLON.Vector3(0, 5, 0), playerBody.getAbsolutePosition());
                    canJump = true;
                }
        }); 
        
    
        // Generate new platforms as the player ascends
        if (playerBody.position.y > scene.meshes[scene.meshes.length - 1].position.y - 10) {``
            createPlatform(scene.meshes[scene.meshes.length - 1].position.y + 1);
        }
        if ( gamesScene && gamesScene.activeCamera )
        {
            gamesScene.render();
        }
    });
}

var scene = null;
var engine = null;
var gamesScene = null;
var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

// Create the scene
const createScene = function() {
    const scene = new BABYLON.Scene(engine);

    // initialize plugin
    hk = new BABYLON.HavokPlugin();
    // enable physics in the scene with a gravity
    scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);

    // Create a basic light
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, -1), scene);
	light.position = new BABYLON.Vector3(20, 40, 20);
	light.intensity = 0.7;
    
    // Create the player body sphere
    playerBody = BABYLON.MeshBuilder.CreateSphere('playerBody', { diameter: 1.0 }, scene);
    playerBody.isVisible = false;
    playerBody.position.y = 1;

    // Enable physics for the player
    playerAggregate = new BABYLON.PhysicsAggregate(playerBody, BABYLON.PhysicsShapeType.SPHERE, { mass: 0.2, restitution: 0.5 }, scene);
    playerAggregate.body.setCollisionCallbackEnabled(true);

    // Create player sprite and physics body
    const playerManager = new BABYLON.SpriteManager('playerManager', 'doodle_cute.png', 1, { width: 648, height: 385 }, scene);
    playerSprite = new BABYLON.Sprite('player', playerManager);
    playerSprite.width = 1.5;
    playerSprite.height = 1;

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground1', { width: 10, height: 10 }, scene);
    ground.position.y = -1;
    groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0.5 }, scene);

    // Shadow generator
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.addShadowCaster(playerBody);
    shadowGenerator.usesExponentialShadowMap = true;
    ground.receiveShadows = true;

    // Create a FollowCamera
    const camera = new BABYLON.FollowCamera('followCamera', new BABYLON.Vector3(0, 10, -10), scene);
    camera.lockedTarget = playerBody; // Set the target to follow
    camera.radius = 10; // Distance from the target
    camera.heightOffset = 5; // Height above the target
    camera.rotationOffset = 0; // Angle around the target
    camera.cameraAcceleration = 0.05; // Acceleration of the camera
    camera.maxCameraSpeed = 10; // Maximum speed the camera can move

    camera.attachControl(canvas, true);
    camera.inputs.clear();


    // Function to create random platforms
    createPlatform = function(yPosition) {
        const platform = BABYLON.MeshBuilder.CreateBox('platform', { width: 2, height: 0.1, depth: 2 }, scene);
        platform.position.x = Math.random() * 10 - 5;
        platform.position.y = yPosition;
        platform.position.z = 0;
        platform.physicsImpostor = new BABYLON.PhysicsAggregate(platform, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0.5 }, scene);
        platform.receiveShadows = true;
        return platform;
    };

    // Create the first platform
    firstPlatform = createPlatform(0);

    // Create initial platforms
    for (let i = 1; i < 10; i++) {
        createPlatform(i * 2);
    }

    // Function to handle jumping and movement
    window.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && canJump) {
            playerAggregate.body.setLinearVelocity(new BABYLON.Vector3(0, 10, 0), playerBody.getAbsolutePosition());;
            canJump = false;
        }
    });

    
    window.addEventListener('keydown', function(event) {
        if (!canJump) {
            if (event.code === 'ArrowLeft') {
                playerAggregate.body.applyImpulse(new BABYLON.Vector3(1, 0, 0), playerBody.getAbsolutePosition()); 
            }
            if (event.code === 'ArrowRight') {
                playerAggregate.body.applyImpulse(new BABYLON.Vector3(-1, 0, 0), playerBody.getAbsolutePosition());
            }
        }
    });

    return scene;
};


window.init = async function() 
{
    globalThis.HK = await HavokPhysics();

    // Initialize Babylon engine
    var asyncEngineCreation = async function() 
    {
        try 
        {
            return createDefaultEngine();
        } catch ( e )
        {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }
    window.engine = await asyncEngineCreation();
 
    if (!engine) throw "Engine is not ready!";
    gameLoop(engine);

    window.scene = createScene();

};

init().then( () => {
    gamesScene = scene
} );

// Resize event
window.addEventListener('resize', function() {
    engine.resize();
});
