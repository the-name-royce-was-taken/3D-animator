import * as THREE from "three";

export default class BoneUtils {
    constructor(bone = null) {
        this.bone = null;

        this.listeners = {
            changed: [],
        };

        if (bone) {
            this.setBone(bone);
        }
    }

    setBone(bone) {
        if (
            bone &&
            !bone.isBone
        ) {
            throw new Error(
                "BoneUtils: expected a THREE.Bone."
            );
        }

        this.bone =
            bone || null;

        return this;
    }

    getBone() {
        return this.bone;
    }

    isValid() {
        return Boolean(
            this.bone &&
            this.bone.isBone
        );
    }

    getName() {
        return (
            this.bone?.name ||
            ""
        );
    }

    setName(name) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.name =
            String(name || "");

        this.emit("changed", {
            bone: this.bone,
            type: "name",
        });

        return true;
    }

    getParent() {
        if (
            !this.bone?.parent?.isBone
        ) {
            return null;
        }

        return this.bone.parent;
    }

    getChildren() {
        if (!this.isValid()) {
            return [];
        }

        return this.bone.children.filter(
            (child) => child.isBone
        );
    }

    getChildCount() {
        return this.getChildren().length;
    }

    getSiblings() {
        const parent =
            this.getParent();

        if (!parent) {
            return [];
        }

        return parent.children.filter(
            (child) =>
                child.isBone &&
                child !== this.bone
        );
    }

    getDepth() {
        if (!this.isValid()) {
            return 0;
        }

        let depth = 0;
        let current = this.bone;

        while (current?.parent) {
            if (current.parent.isBone) {
                depth += 1;
            }

            current = current.parent;
        }

        return depth;
    }

    getAncestors() {
        const ancestors = [];
        let current =
            this.getParent();

        while (current) {
            ancestors.push(current);
            current =
                current.parent?.isBone
                    ? current.parent
                    : null;
        }

        return ancestors;
    }

    getDescendants() {
        if (!this.isValid()) {
            return [];
        }

        const result = [];

        const visit = (bone) => {
            bone.children.forEach(
                (child) => {
                    if (!child.isBone) {
                        return;
                    }

                    result.push(child);
                    visit(child);
                }
            );
        };

        visit(this.bone);

        return result;
    }

    getChainToRoot() {
        if (!this.isValid()) {
            return [];
        }

        const chain = [];
        let current = this.bone;

        while (current) {
            if (current.isBone) {
                chain.unshift(current);
            }

            current =
                current.parent?.isBone
                    ? current.parent
                    : null;
        }

        return chain;
    }

    getChainToChild(
        child
    ) {
        if (
            !this.isValid() ||
            !child?.isBone
        ) {
            return [];
        }

        const chain = [];
        let current = child;

        while (current) {
            chain.unshift(current);

            if (current === this.bone) {
                return chain;
            }

            current =
                current.parent?.isBone
                    ? current.parent
                    : null;
        }

        return [];
    }

    addChild(child) {
        if (
            !this.isValid() ||
            !child?.isBone
        ) {
            return false;
        }

        this.bone.add(child);

        this.emit("changed", {
            bone: this.bone,
            child,
            type: "addChild",
        });

        return true;
    }

    removeChild(child) {
        if (
            !this.isValid() ||
            !child
        ) {
            return false;
        }

        if (
            child.parent !== this.bone
        ) {
            return false;
        }

        this.bone.remove(child);

        this.emit("changed", {
            bone: this.bone,
            child,
            type: "removeChild",
        });

        return true;
    }

    reparent(
        newParent,
        preserveWorldTransform = true
    ) {
        if (!this.isValid()) {
            return false;
        }

        if (
            newParent &&
            !newParent.isObject3D
        ) {
            return false;
        }

        if (
            newParent === this.bone ||
            this.isDescendantOf(newParent)
        ) {
            return false;
        }

        const worldPosition =
            new THREE.Vector3();

        const worldQuaternion =
            new THREE.Quaternion();

        const worldScale =
            new THREE.Vector3();

        if (preserveWorldTransform) {
            this.bone.getWorldPosition(
                worldPosition
            );

            this.bone.getWorldQuaternion(
                worldQuaternion
            );

            this.bone.getWorldScale(
                worldScale
            );
        }

        if (this.bone.parent) {
            this.bone.parent.remove(
                this.bone
            );
        }

        if (newParent) {
            newParent.add(
                this.bone
            );
        }

        if (preserveWorldTransform) {
            if (newParent) {
                newParent.worldToLocal(
                    worldPosition
                );

                this.bone.position.copy(
                    worldPosition
                );

                const parentQuaternion =
                    new THREE.Quaternion();

                const parentScale =
                    new THREE.Vector3();

                newParent.getWorldQuaternion(
                    parentQuaternion
                );

                newParent.getWorldScale(
                    parentScale
                );

                parentQuaternion
                    .invert();

                this.bone.quaternion
                    .copy(
                        parentQuaternion
                    )
                    .multiply(
                        worldQuaternion
                    );

                this.bone.scale.set(
                    worldScale.x /
                        parentScale.x,
                    worldScale.y /
                        parentScale.y,
                    worldScale.z /
                        parentScale.z
                );
            } else {
                this.bone.position.copy(
                    worldPosition
                );

                this.bone.quaternion.copy(
                    worldQuaternion
                );

                this.bone.scale.copy(
                    worldScale
                );
            }
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            parent: newParent,
            type: "reparent",
        });

        return true;
    }

    isDescendantOf(
        object
    ) {
        if (
            !object ||
            !this.isValid()
        ) {
            return false;
        }

        let current =
            this.bone.parent;

        while (current) {
            if (current === object) {
                return true;
            }

            current = current.parent;
        }

        return false;
    }

    isAncestorOf(
        object
    ) {
        if (
            !object ||
            !this.isValid()
        ) {
            return false;
        }

        let current =
            object.parent;

        while (current) {
            if (current === this.bone) {
                return true;
            }

            current = current.parent;
        }

        return false;
    }

    getLocalPosition() {
        return this.isValid()
            ? this.bone.position.clone()
            : new THREE.Vector3();
    }

    setLocalPosition(
        position
    ) {
        if (
            !this.isValid() ||
            !position
        ) {
            return false;
        }

        if (
            position.isVector3
        ) {
            this.bone.position.copy(
                position
            );
        } else if (
            Array.isArray(position)
        ) {
            this.bone.position.set(
                position[0] || 0,
                position[1] || 0,
                position[2] || 0
            );
        } else {
            return false;
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "position",
        });

        return true;
    }

    getWorldPosition() {
        if (!this.isValid()) {
            return new THREE.Vector3();
        }

        const position =
            new THREE.Vector3();

        this.bone.getWorldPosition(
            position
        );

        return position;
    }

    setWorldPosition(
        position
    ) {
        if (
            !this.isValid() ||
            !position
        ) {
            return false;
        }

        const world =
            position.isVector3
                ? position.clone()
                : new THREE.Vector3(
                      position[0] || 0,
                      position[1] || 0,
                      position[2] || 0
                  );

        if (this.bone.parent) {
            this.bone.parent.worldToLocal(
                world
            );
        }

        this.bone.position.copy(
            world
        );

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "worldPosition",
        });

        return true;
    }

    getLocalQuaternion() {
        return this.isValid()
            ? this.bone.quaternion.clone()
            : new THREE.Quaternion();
    }

    setLocalQuaternion(
        quaternion
    ) {
        if (
            !this.isValid() ||
            !quaternion
        ) {
            return false;
        }

        if (
            quaternion.isQuaternion
        ) {
            this.bone.quaternion.copy(
                quaternion
            );
        } else if (
            Array.isArray(quaternion)
        ) {
            this.bone.quaternion.set(
                quaternion[0] || 0,
                quaternion[1] || 0,
                quaternion[2] || 0,
                quaternion[3] ??
                    1
            );
        } else {
            return false;
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "rotation",
        });

        return true;
    }

    getWorldQuaternion() {
        if (!this.isValid()) {
            return new THREE.Quaternion();
        }

        const quaternion =
            new THREE.Quaternion();

        this.bone.getWorldQuaternion(
            quaternion
        );

        return quaternion;
    }

    setWorldQuaternion(
        quaternion
    ) {
        if (
            !this.isValid() ||
            !quaternion
        ) {
            return false;
        }

        const world =
            quaternion.isQuaternion
                ? quaternion.clone()
                : new THREE.Quaternion(
                      quaternion[0] || 0,
                      quaternion[1] || 0,
                      quaternion[2] || 0,
                      quaternion[3] ??
                          1
                  );

        if (this.bone.parent) {
            const parentRotation =
                new THREE.Quaternion();

            this.bone.parent.getWorldQuaternion(
                parentRotation
            );

            parentRotation.invert();

            this.bone.quaternion
                .copy(parentRotation)
                .multiply(world);
        } else {
            this.bone.quaternion.copy(
                world
            );
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "worldRotation",
        });

        return true;
    }

    getEuler() {
        return this.isValid()
            ? this.bone.rotation.clone()
            : new THREE.Euler();
    }

    setEuler(
        x,
        y,
        z,
        order = "XYZ"
    ) {
        if (!this.isValid()) {
            return false;
        }

        if (
            x?.isEuler
        ) {
            this.bone.rotation.copy(
                x
            );
        } else if (
            Array.isArray(x)
        ) {
            this.bone.rotation.set(
                x[0] || 0,
                x[1] || 0,
                x[2] || 0,
                y || order
            );
        } else {
            this.bone.rotation.set(
                x || 0,
                y || 0,
                z || 0,
                order
            );
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "euler",
        });

        return true;
    }

    rotateX(
        radians
    ) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.rotateX(
            radians
        );

        this.emit("changed", {
            bone: this.bone,
            type: "rotateX",
        });

        return true;
    }

    rotateY(
        radians
    ) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.rotateY(
            radians
        );

        this.emit("changed", {
            bone: this.bone,
            type: "rotateY",
        });

        return true;
    }

    rotateZ(
        radians
    ) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.rotateZ(
            radians
        );

        this.emit("changed", {
            bone: this.bone,
            type: "rotateZ",
        });

        return true;
    }

    getLocalScale() {
        return this.isValid()
            ? this.bone.scale.clone()
            : new THREE.Vector3(
                  1,
                  1,
                  1
              );
    }

    setLocalScale(
        scale
    ) {
        if (
            !this.isValid() ||
            !scale
        ) {
            return false;
        }

        if (
            scale.isVector3
        ) {
            this.bone.scale.copy(
                scale
            );
        } else if (
            Array.isArray(scale)
        ) {
            this.bone.scale.set(
                scale[0] ?? 1,
                scale[1] ?? 1,
                scale[2] ?? 1
            );
        } else {
            return false;
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "scale",
        });

        return true;
    }

    getWorldScale() {
        if (!this.isValid()) {
            return new THREE.Vector3(
                1,
                1,
                1
            );
        }

        const scale =
            new THREE.Vector3();

        this.bone.getWorldScale(
            scale
        );

        return scale;
    }

    getLength() {
        if (!this.isValid()) {
            return 0;
        }

        const child =
            this.getChildren()[0];

        if (!child) {
            return 0;
        }

        return this.getWorldPosition()
            .distanceTo(
                new BoneUtils(
                    child
                ).getWorldPosition()
            );
    }

    getDirection(
        targetChild = null
    ) {
        if (!this.isValid()) {
            return new THREE.Vector3(
                0,
                1,
                0
            );
        }

        const child =
            targetChild?.isBone
                ? targetChild
                : this.getChildren()[0];

        if (!child) {
            return new THREE.Vector3(
                0,
                1,
                0
            );
        }

        const start =
            this.getWorldPosition();

        const end =
            new BoneUtils(
                child
            ).getWorldPosition();

        return end
            .sub(start)
            .normalize();
    }

    lookAt(
        target
    ) {
        if (
            !this.isValid() ||
            !target
        ) {
            return false;
        }

        const point =
            target.isVector3
                ? target
                : new THREE.Vector3(
                      target[0] || 0,
                      target[1] || 0,
                      target[2] || 0
                  );

        this.bone.lookAt(
            point
        );

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "lookAt",
        });

        return true;
    }

    captureTransform() {
        if (!this.isValid()) {
            return null;
        }

        return {
            uuid:
                this.bone.uuid,

            name:
                this.bone.name,

            position:
                this.bone.position.toArray(),

            quaternion:
                this.bone.quaternion.toArray(),

            rotation:
                [
                    this.bone.rotation.x,
                    this.bone.rotation.y,
                    this.bone.rotation.z,
                    this.bone.rotation.order,
                ],

            scale:
                this.bone.scale.toArray(),
        };
    }

    applyTransform(
        transform
    ) {
        if (
            !this.isValid() ||
            !transform
        ) {
            return false;
        }

        if (
            Array.isArray(
                transform.position
            )
        ) {
            this.bone.position.fromArray(
                transform.position
            );
        }

        if (
            Array.isArray(
                transform.quaternion
            ) &&
            transform.quaternion.length >=
                4
        ) {
            this.bone.quaternion.fromArray(
                transform.quaternion
            );
        } else if (
            Array.isArray(
                transform.rotation
            )
        ) {
            this.bone.rotation.set(
                transform.rotation[0] ||
                    0,
                transform.rotation[1] ||
                    0,
                transform.rotation[2] ||
                    0,
                transform.rotation[3] ||
                    "XYZ"
            );
        }

        if (
            Array.isArray(
                transform.scale
            )
        ) {
            this.bone.scale.fromArray(
                transform.scale
            );
        }

        this.bone.updateMatrix();
        this.bone.updateMatrixWorld(
            true
        );

        this.emit("changed", {
            bone: this.bone,
            type: "transform",
        });

        return true;
    }

    setVisible(
        visible
    ) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.visible =
            Boolean(visible);

        return true;
    }

    setUserData(
        key,
        value
    ) {
        if (!this.isValid()) {
            return false;
        }

        this.bone.userData =
            this.bone.userData ||
            {};

        this.bone.userData[key] =
            value;

        return true;
    }

    getUserData(
        key
    ) {
        if (!this.isValid()) {
            return undefined;
        }

        return this.bone.userData?.[
            key
        ];
    }

    toJSON() {
        if (!this.isValid()) {
            return null;
        }

        return {
            uuid:
                this.bone.uuid,

            name:
                this.bone.name,

            parent:
                this.getParent()?.uuid ||
                null,

            position:
                this.bone.position.toArray(),

            quaternion:
                this.bone.quaternion.toArray(),

            scale:
                this.bone.scale.toArray(),

            depth:
                this.getDepth(),
        };
    }

    on(
        event,
        callback
    ) {
        if (
            !this.listeners[
                event
            ] ||
            typeof callback !==
                "function"
        ) {
            return () => {};
        }

        this.listeners[
            event
        ].push(
            callback
        );

        return () =>
            this.off(
                event,
                callback
            );
    }

    off(
        event,
        callback
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (!listeners) {
            return;
        }

        const index =
            listeners.indexOf(
                callback
            );

        if (index !== -1) {
            listeners.splice(
                index,
                1
            );
        }
    }

    emit(
        event,
        data
    ) {
        const listeners =
            this.listeners[
                event
            ];

        if (!listeners) {
            return;
        }

        listeners
            .slice()
            .forEach(
                (callback) => {
                    try {
                        callback(
                            data
                        );
                    } catch (error) {
                        console.error(
                            `BoneUtils event error (${event}):`,
                            error
                        );
                    }
                }
            );
    }

    dispose() {
        this.bone = null;

        this.listeners = {
            changed: [],
        };
    }

    static create(
        name = "Bone",
        position = null
    ) {
        const bone =
            new THREE.Bone();

        bone.name = name;

        if (
            position
        ) {
            if (
                position.isVector3
            ) {
                bone.position.copy(
                    position
                );
            } else if (
                Array.isArray(
                    position
                )
            ) {
                bone.position.set(
                    position[0] || 0,
                    position[1] || 0,
                    position[2] || 0
                );
            }
        }

        return bone;
    }

    static isBone(
        object
    ) {
        return Boolean(
            object &&
            object.isBone
        );
    }

    static distance(
        boneA,
        boneB
    ) {
        if (
            !boneA?.isBone ||
            !boneB?.isBone
        ) {
            return 0;
        }

        const a =
            new THREE.Vector3();

        const b =
            new THREE.Vector3();

        boneA.getWorldPosition(a);
        boneB.getWorldPosition(b);

        return a.distanceTo(b);
    }
}
