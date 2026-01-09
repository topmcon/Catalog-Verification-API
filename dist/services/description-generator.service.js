"use strict";
/**
 * Description Generator Service
 * Generates professional, luxurious product descriptions
 * Highlights premium features: Built-in, Panel Ready, special features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDescription = generateDescription;
exports.enhanceDescription = enhanceDescription;
const title_generator_service_1 = require("./title-generator.service");
/**
 * Generate a professional product description
 */
function generateDescription(input) {
    const paragraphs = [];
    // 1. Opening statement (brand and category intro)
    paragraphs.push(generateOpening(input));
    // 2. Key features and specifications
    const featuresP = generateFeaturesSection(input);
    if (featuresP) {
        paragraphs.push(featuresP);
    }
    // 3. Premium features highlight (Built-in, Panel Ready, etc.)
    const premiumP = generatePremiumHighlights(input);
    if (premiumP) {
        paragraphs.push(premiumP);
    }
    // 4. Specifications summary
    const specsP = generateSpecsSummary(input);
    if (specsP) {
        paragraphs.push(specsP);
    }
    return paragraphs.join('\n\n');
}
/**
 * Generate opening paragraph
 */
function generateOpening(input) {
    const brand = input.brand || 'This premium';
    const category = input.category.replace(/ #$/, '');
    const isPremium = input.brand ? (0, title_generator_service_1.isPremiumBrand)(input.brand) : false;
    let opening;
    if (isPremium) {
        opening = `Elevate your kitchen with the ${brand} ${category}, a masterpiece of culinary engineering designed for the discerning homeowner.`;
    }
    else {
        opening = `Discover the perfect blend of style and functionality with this ${brand} ${category}, crafted to enhance your home.`;
    }
    // Add style/type context
    if (input.style || input.type) {
        const styleType = input.style || input.type;
        opening += ` This ${styleType?.toLowerCase()} design brings professional-grade performance to your living space.`;
    }
    return opening;
}
/**
 * Generate features section
 */
function generateFeaturesSection(input) {
    if (!input.features || input.features.length === 0) {
        return null;
    }
    const keyFeatures = input.features.slice(0, 5);
    const featureList = keyFeatures.map(f => capitalizeFirst(f)).join(', ');
    return `Key features include ${featureList}, ensuring exceptional performance and convenience for everyday use.`;
}
/**
 * Generate premium features highlight
 */
function generatePremiumHighlights(input) {
    const premiumFeatures = [];
    // Check installation type
    if (input.installationType) {
        const instLower = input.installationType.toLowerCase();
        if (instLower.includes('built-in') || instLower.includes('built in')) {
            premiumFeatures.push('sleek built-in installation');
        }
        if (instLower.includes('panel ready')) {
            premiumFeatures.push('panel-ready design for seamless integration');
        }
    }
    // Check features array for premium keywords
    if (input.features) {
        for (const feat of input.features) {
            const featLower = feat.toLowerCase();
            if (featLower.includes('panel ready') && !premiumFeatures.some(p => p.includes('panel'))) {
                premiumFeatures.push('custom panel-ready capability');
            }
            if (featLower.includes('wifi') || featLower.includes('smart')) {
                premiumFeatures.push('smart connectivity features');
                break;
            }
            if (featLower.includes('commercial') || featLower.includes('professional')) {
                premiumFeatures.push('commercial-grade construction');
                break;
            }
        }
    }
    // Check finish for premium materials
    if (input.finish || input.material) {
        const finishMat = (input.finish || input.material || '').toLowerCase();
        if (finishMat.includes('stainless')) {
            premiumFeatures.push('premium stainless steel finish');
        }
    }
    if (premiumFeatures.length === 0) {
        return null;
    }
    return `This exceptional appliance features ${premiumFeatures.join(', ')}, making it the perfect choice for luxury kitchens and high-end renovations.`;
}
/**
 * Generate specifications summary
 */
function generateSpecsSummary(input) {
    const specs = [];
    // Dimensions
    if (input.width && input.height && input.depth) {
        specs.push(`dimensions of ${input.width}" W x ${input.height}" H x ${input.depth}" D`);
    }
    else if (input.width) {
        specs.push(`a ${input.width}-inch width`);
    }
    // Capacity
    if (input.totalCapacity) {
        specs.push(`${input.totalCapacity} cubic feet of capacity`);
    }
    // Fuel type
    if (input.fuelType) {
        specs.push(`${input.fuelType.toLowerCase()} operation`);
    }
    if (specs.length === 0) {
        return null;
    }
    return `Featuring ${specs.join(', ')}, this unit is designed to meet the demands of modern living while complementing any décor.`;
}
/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    if (!str)
        return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
/**
 * Enhance an existing description with premium language
 */
function enhanceDescription(existing, input) {
    let enhanced = existing;
    // Add premium opening if description starts generically
    if (!existing.toLowerCase().includes('elevate') &&
        !existing.toLowerCase().includes('luxury') &&
        input.brand && (0, title_generator_service_1.isPremiumBrand)(input.brand)) {
        enhanced = `Elevate your space with ${input.brand}. ${enhanced}`;
    }
    // Ensure premium features are highlighted
    const premiumHighlight = generatePremiumHighlights(input);
    if (premiumHighlight && !existing.toLowerCase().includes('built-in') &&
        !existing.toLowerCase().includes('panel ready')) {
        enhanced += '\n\n' + premiumHighlight;
    }
    return enhanced;
}
exports.default = { generateDescription, enhanceDescription };
//# sourceMappingURL=description-generator.service.js.map