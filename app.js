// Get the canvas element
const canvas = document.getElementById('renderCanvas');

// Initialize Babylon engine
const engine = new BABYLON.Engine(canvas, true);

// Create the scene
const createScene = function() {
    const scene = new BABYLON.Scene(engine);

    // Enable physics
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    // Create a basic light
    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

    // Create the player sphere
    const player = BABYLON.MeshBuilder.CreateSphere('player', { diameter: 1 }, scene);
    player.position.y = 1;

    // Enable physics for the player
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground1', { width: 10, height: 10 }, scene);
    ground.position.y = -1;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);

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
        platform.physicsImpostor = new BABYLON.PhysicsImpostor(platform, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
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
            player.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 10, 0), player.getAbsolutePosition());
            canJump = false;
        }
    });

    window.addEventListener('keydown', function(event) {
        if (!canJump) {
            if (event.code === 'ArrowLeft') {
                player.physicsImpostor.applyImpulse(new BABYLON.Vector3(1, 0, 0), player.getAbsolutePosition());
            }
            if (event.code === 'ArrowRight') {
                player.physicsImpostor.applyImpulse(new BABYLON.Vector3(-1, 0, 0), player.getAbsolutePosition());
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

const scene = createScene();

// Render loop
engine.runRenderLoop(function() {
    scene.render();
});

// Resize event
window.addEventListener('resize', function() {
    engine.resize();
});
