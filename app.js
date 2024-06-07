// Get the canvas element
const canvas = document.getElementById('renderCanvas');


var startGameLoop = function( engine ) 
{
    engine.runRenderLoop( function() {
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
    const hk = new BABYLON.HavokPlugin();
    // enable physics in the scene with a gravity
    scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);

    // Create a basic light
    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;
    
    // Create the player sphere
    const player = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 1 }, scene);
    player.position.y = 1;

    // Enable physics for the player
    var playerImpostor = new BABYLON.PhysicsAggregate(player, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.9 }, scene);

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground1', { width: 10, height: 10 }, scene);
    ground.position.y = -1;
    ground.physicsImpostor = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0.9 }, scene);

    // Create a FollowCamera
    const camera = new BABYLON.FollowCamera('followCamera', new BABYLON.Vector3(0, 10, -10), scene);
    camera.lockedTarget = player; // Set the target to follow
    camera.radius = 10; // Distance from the target
    camera.heightOffset = 5; // Height above the target
    camera.rotationOffset = 0; // Angle around the target
    camera.cameraAcceleration = 0.05; // Acceleration of the camera
    camera.maxCameraSpeed = 10; // Maximum speed the camera can move

    camera.attachControl(canvas, true);

    // Function to create random platforms
    const createPlatform = function(yPosition) {
        const platform = BABYLON.MeshBuilder.CreateBox('platform', { width: 2, height: 0.5, depth: 2 }, scene);
        platform.position.x = Math.random() * 10 - 5;
        platform.position.y = yPosition;
        platform.position.z = Math.random() * 10 - 5;
        platform.physicsImpostor = new BABYLON.PhysicsAggregate(platform, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0.9 }, scene);
        return platform;
    };

    // Create the first platform
    let firstPlatform = createPlatform(0);

    // Create initial platforms
    for (let i = 1; i < 10; i++) {
        createPlatform(i * 2);
    }

    // Function to handle jumping and movement
    let canJump = true;
    window.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && canJump) {
            playerImpostor.body.applyImpulse(new BABYLON.Vector3(0, 5, 0), player.getAbsolutePosition());
            canJump = false;
        }
    });

    window.addEventListener('keydown', function(event) {
        if (!canJump) {
            if (event.code === 'ArrowLeft') {
                playerImpostor.body.applyImpulse(new BABYLON.Vector3(1, 0, 0), player.getAbsolutePosition());
            }
            if (event.code === 'ArrowRight') {
                playerImpostor.body.applyImpulse(new BABYLON.Vector3(-1, 0, 0), player.getAbsolutePosition());
            }
        }
    });

    // Reset jump ability when player touches ground or platforms
    scene.registerBeforeRender(function() {
        if (player.position.y <= firstPlatform.position.y - 1) {
            alert('Game Over');
            window.location.reload();
        }

        if (player.position.y <= 1.1) {
            canJump = true;
        }

        scene.meshes.forEach(function(mesh) {
            if (mesh.name.startsWith('platform') && player.intersectsMesh(mesh, false)) {
                canJump = true;
            }
        });

        // Generate new platforms as the player ascends
        if (player.position.y > scene.meshes[scene.meshes.length - 1].position.y - 10) {
            createPlatform(scene.meshes[scene.meshes.length - 1].position.y + 2);
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
    startGameLoop(engine);

    window.scene = createScene();

};

init().then( () => {
    gamesScene = scene
} );

// Resize event
window.addEventListener('resize', function() {
    engine.resize();
});
