import {
    WebGLRenderer,
    Scene,
    Camera,
} from "three";

export default class Thumbnail {
    capture(
        renderer: WebGLRenderer,
        scene: Scene,
        camera: Camera,
        width: number = 512,
        height: number = 512
    ): Promise<Blob> {
        return new Promise(
            (resolve) => {
                const oldSize =
                    renderer.getSize(
                        renderer.domElement
                    );

                const oldPixelRatio =
                    renderer.getPixelRatio();

                renderer.setPixelRatio(1);

                renderer.setSize(
                    width,
                    height,
                    false
                );

                renderer.render(
                    scene,
                    camera
                );

                renderer.domElement.toBlob(
                    (blob) => {
                        renderer.setSize(
                            oldSize.x,
                            oldSize.y,
                            false
                        );

                        renderer.setPixelRatio(
                            oldPixelRatio
                        );

                        resolve(
                            blob ??
                                new Blob()
                        );
                    },
                    "image/png"
                );
            }
        );
    }

    download(
        blob: Blob,
        filename: string = "thumbnail.png"
    ): void {
        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            filename;

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );
    }
}
