const mongoose = require('mongoose');

const seoMetaSchema = new mongoose.Schema({
    // Page Identification
    pageName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pageSlug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pageCategory: {
        type: String,
        required: true
    },

    // Basic SEO Meta Tags
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 360
    },
    keywords: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Curve & Comfort'
    },
    robots: {
        type: String,
        default: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    },
    canonicalUrl: {
        type: String,
        required: true
    },

    // Open Graph Meta Tags
    ogLocale: {
        type: String,
        default: 'en_US'
    },
    ogType: {
        type: String,
        enum: ['website', 'product', 'product.group', 'place', 'article'],
        default: 'website'
    },
    ogTitle: {
        type: String,
        required: true
    },
    ogDescription: {
        type: String,
        required: true
    },
    ogUrl: {
        type: String,
        required: true
    },
    ogSiteName: {
        type: String,
        default: 'Curve & Comfort'
    },
    ogImage: {
        url: {
            type: String,
            required: true
        },
        width: {
            type: Number,
            default: 1200
        },
        height: {
            type: Number,
            default: 630
        },
        alt: {
            type: String,
            required: true
        }
    },
 
    // Twitter Card Meta Tags
    twitterCard: {
        type: String,
        default: 'summary_large_image'
    },
    twitterTitle: {
        type: String,
        required: true
    },
    twitterDescription: {
        type: String,
        required: true
    },
    twitterImage: {
        type: String,
        required: true
    },
    twitterSite: {
        type: String,
        default: '@curve_comfort'
    },

    // Additional SEO Meta Tags
    geoRegion: {
        type: String,
        default: 'IN'
    },
    geoPlacename: {
        type: String,
        default: 'India'
    },
    language: {
        type: String,
        default: 'English'
    },
    revisitAfter: {
        type: String,
        default: '7 days'
    },
    distribution: {
        type: String,
        default: 'global'
    },
    rating: {
        type: String,
        default: 'general'
    },

    // Schema Markup (for product pages)
    schemaMarkup: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // Additional Fields
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
    }
}, {
    timestamps: true
});

// Indexes for better query performance
seoMetaSchema.index({ pageCategory: 1 });
seoMetaSchema.index({ isActive: 1 });

// Virtual for full meta tags generation
seoMetaSchema.virtual('fullMetaTags').get(function () {
    return {
        basic: {
            title: this.title,
            description: this.description,
            keywords: this.keywords,
            author: this.author,
            robots: this.robots,
            canonical: this.canonicalUrl
        },
        openGraph: {
            locale: this.ogLocale,
            type: this.ogType,
            title: this.ogTitle,
            description: this.ogDescription,
            url: this.ogUrl,
            siteName: this.ogSiteName,
            image: this.ogImage
        },
        twitter: {
            card: this.twitterCard,
            title: this.twitterTitle,
            description: this.twitterDescription,
            image: this.twitterImage,
            site: this.twitterSite
        },
        additional: {
            geoRegion: this.geoRegion,
            geoPlacename: this.geoPlacename,
            language: this.language,
            revisitAfter: this.revisitAfter,
            distribution: this.distribution,
            rating: this.rating
        }
    };
});

// Method to generate HTML meta tags
seoMetaSchema.methods.generateMetaTags = function () {
    let html = `<!-- Basic SEO Meta Tags -->
<title>${this.title}</title>
<meta name="robots" content="index, follow">
<meta name="description" content="${this.description}"/>
<meta name="keywords" content="${this.keywords}">
<meta name="author" content="${this.author}">
<meta name="robots" content="${this.robots}" />
<link rel="canonical" href="${this.canonicalUrl}" />

<!-- Open Graph Meta Tags -->
<meta property="og:locale" content="${this.ogLocale}" />
<meta property="og:type" content="${this.ogType}" />
<meta property="og:title" content="${this.ogTitle}"/>
<meta property="og:description" content="${this.ogDescription}"/>
<meta property="og:url" content="${this.ogUrl}" />
<meta property="og:site_name" content="${this.ogSiteName}" />
<meta property="og:image" content="${this.ogImage.url}" />
<meta property="og:image:width" content="${this.ogImage.width}" />
<meta property="og:image:height" content="${this.ogImage.height}" />
<meta property="og:image:alt" content="${this.ogImage.alt}" />

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="${this.twitterCard}" />
<meta name="twitter:title" content="${this.twitterTitle}" />
<meta name="twitter:description" content="${this.twitterDescription}" />
<meta name="twitter:image" content="${this.twitterImage}" />
<meta name="twitter:site" content="${this.twitterSite}" />

<!-- Additional SEO Meta Tags -->
<meta name="geo.region" content="${this.geoRegion}" />
<meta name="geo.placename" content="${this.geoPlacename}" />
<meta name="language" content="${this.language}">
<meta name="revisit-after" content="${this.revisitAfter}">`;

    if (this.distribution) {
        html += `\n<meta name="distribution" content="${this.distribution}">`;
    }
    if (this.rating) {
        html += `\n<meta name="rating" content="${this.rating}">`;
    }

    if (this.schemaMarkup) {
        html += `\n\n<!-- Schema Markup -->
<script type="application/ld+json">
${JSON.stringify(this.schemaMarkup, null, 2)}
</script>`;
    }

    return html;
};

const SeoMeta = mongoose.model('SeoMeta', seoMetaSchema);

module.exports = SeoMeta;
