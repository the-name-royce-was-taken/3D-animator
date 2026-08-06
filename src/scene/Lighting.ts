import {
    AmbientLight,
    DirectionalLight,
    HemisphereLight,
    Scene,
    Vector3,
} from "three";

export default class Lighting {
    public ambient: AmbientLight;
    public directional: DirectionalLight;
    public hemisphere: HemisphereLight;

    constructor() {
        this.ambient = new AmbientLight(
            0xffffff,
            0.6
        );

        this.hemisphere =
            new HemisphereLight(
                0xffffff,
                0x444444,
                0.8
            );

        this.directional =
            new DirectionalLight(
                0xffffff,
                1.2
            );

        this.directional.position.set(
            5,
            10,
            5
        );

        this.directional.target.position.set(
            0,
            0,
            0
        );
    }

    addToScene(
        scene: Scene
    ): void {
        scene.add(this.ambient);
        scene.add(this.hemisphere);

        scene.add(
            this.directional
        );

        scene.add(
            this.directional.target
        );
    }

    setIntensity(
        intensity: number
    ): void {
        this.directional.intensity =
            intensity;
    }

    setPosition(
        position: Vector3
    ): void {
        this.directional.position.copy(
            position
        );
    }
}
