const basePath = "./content/logo/";
const logoNames = ["football_logo.png", "mocap_logo.png", "tennis_logo.png"];
const chosenLogo = logoNames[Math.floor(Math.random() * logoNames.length)];
const logoPath = basePath + chosenLogo;

function setFavicon() {
    // Remove existing icons
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(el => el.remove());

    // Apple touch icon
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.sizes = '180x180';
    appleIcon.href = logoPath;

    // 32x32 favicon
    const icon32 = document.createElement('link');
    icon32.rel = 'icon';
    icon32.type = 'image/png';
    icon32.sizes = '32x32';
    icon32.href = logoPath;

    // 16x16 favicon
    const icon16 = document.createElement('link');
    icon16.rel = 'icon';
    icon16.type = 'image/png';
    icon16.sizes = '16x16';
    icon16.href = logoPath;

    // Append all to head
    document.head.appendChild(appleIcon);
    document.head.appendChild(icon32);
    document.head.appendChild(icon16);
}

setFavicon();