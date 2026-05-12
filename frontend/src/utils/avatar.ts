export const AVATAR_GRADIENTS = [
    "from-indigo-500 to-indigo-700",
    "from-blue-500 to-blue-700",
    "from-violet-500 to-purple-700",
    "from-fuchsia-500 to-pink-700",
    "from-rose-500 to-rose-700",
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-700",
    "from-cyan-500 to-sky-700",
];

export const getAvatarGradient = (idOrName: number | string | undefined | null): string => {
    if (idOrName === undefined || idOrName === null) {
        return AVATAR_GRADIENTS[0];
    }
    if (typeof idOrName === "number") {
        const index = Math.abs(idOrName) % AVATAR_GRADIENTS.length;
        return AVATAR_GRADIENTS[index];
    }
    // String name hashing
    let hash = 0;
    for (let i = 0; i < idOrName.length; i++) {
        hash = idOrName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
};
