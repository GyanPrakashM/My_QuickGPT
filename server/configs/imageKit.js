import ImageKit from "imagekit";

const cleanEnvValue = (value) => value?.trim().replace(/^['"]|['"]$/g, "");

const imageKitConfig = {
    publicKey: cleanEnvValue(process.env.IMAGEKIT_PUBLIC_KEY),
    privateKey: cleanEnvValue(process.env.IMAGEKIT_PRIVATE_KEY),
    urlEndpoint: cleanEnvValue(process.env.IMAGEKIT_URL_ENDPOINT),
};

const missingKeys = Object.entries(imageKitConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingKeys.length > 0) {
    throw new Error(`Missing ImageKit configuration: ${missingKeys.join(", ")}`);
}

const imageKit = new ImageKit({
    publicKey: imageKitConfig.publicKey,
    privateKey: imageKitConfig.privateKey,
    urlEndpoint: imageKitConfig.urlEndpoint,
});

export const imageKitUrlEndpoint = imageKitConfig.urlEndpoint;
export default imageKit;
