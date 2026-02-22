/**
 * Advanced Secure Skill Validation System
 * Enterprise-grade skill extraction with multi-layer security
 * Enhanced with XSS protection, entropy analysis, and pattern-based validation
 */

class AdvancedSkillValidator {
    constructor() {
        this.initializeSecurityPatterns();
        this.initializeLegitimateSkills();
        this.initializeBlacklists();
    }

    // Initialize security patterns to prevent malicious input
    initializeSecurityPatterns() {
        this.securityPatterns = {
            xssPatterns: [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /data:text\/html/gi,
                /vbscript:/gi,
                /expression\(/gi
            ],
            injectionPatterns: [
                /[<>]/g,
                /['"]\s*;\s*['"]/g,
                /\/\*[\s\S]*?\*\//g,
                /--[\s\S]*$/gm
            ],
            maliciousPatterns: [
                /eval\s*\(/gi,
                /document\./gi,
                /window\./gi,
                /alert\s*\(/gi,
                /prompt\s*\(/gi,
                /confirm\s*\(/gi
            ]
        };
    }

    // Initialize comprehensive legitimate skill patterns
    initializeLegitimateSkills() {
        this.legitimateSkillPatterns = [
            // Programming Languages (with version awareness and case variations)
            /^(javascript|js|typescript|ts|python|java|c\+\+|cpp|c#|csharp|c\s*sharp|php|ruby|swift|kotlin|go|golang|rust|scala|dart|r|matlab|perl|shell|bash|zsh|powershell|sql|html5?|css3?|xml|json|yaml|toml|ini)$/i,
            
            // Web Technologies & Frameworks (comprehensive and version-aware)
            /^(react|reactjs|react\.js|angular|angularjs|angular\.js|vue|vuejs|vue\.js|nodejs|node\.js|express|expressjs|express\.js|django|flask|spring|springboot|spring\s*boot|laravel|rails|ruby\s*on\s*rails|asp\.net|blazor|nextjs|next\.js|nuxtjs|nuxt\.js|gatsby|gatsbyjs|svelte|sveltekit|ember|emberjs|backbone|backbonejs|jquery|bootstrap|tailwind|tailwindcss|bulma|foundation|semantic\s*ui|material\s*ui|chakra\s*ui|ant\s*design|vuetify)$/i,
            
            // Databases & Data Storage (enhanced with NoSQL and modern solutions)
            /^(mysql|postgresql|postgres|mongodb|mongo|redis|elasticsearch|elastic\s*search|cassandra|dynamodb|dynamo\s*db|oracle|sqlite|mariadb|firebase|firestore|neo4j|couchdb|couch\s*db|influxdb|influx\s*db|clickhouse|click\s*house|snowflake|bigquery|big\s*query|supabase|planetscale|planet\s*scale|fauna|faunadb)$/i,
            
            // Cloud Platforms & DevOps (enhanced security-aware patterns)
            /^(aws|amazon\s*web\s*services|azure|microsoft\s*azure|gcp|google\s*cloud|google\s*cloud\s*platform|docker|kubernetes|k8s|jenkins|gitlab|git\s*lab|github|git\s*hub|bitbucket|bit\s*bucket|terraform|ansible|vagrant|ci\/cd|continuous\s*integration|continuous\s*deployment|devops|serverless|lambda|aws\s*lambda|ec2|s3|rds|cloudformation|cloud\s*formation|helm|istio|prometheus|grafana|datadog|data\s*dog|newrelic|new\s*relic|splunk|nagios|zabbix)$/i,
            
            // Development Tools & IDEs (comprehensive list)
            /^(git|svn|subversion|mercurial|jira|confluence|slack|teams|microsoft\s*teams|discord|figma|sketch|adobe\s*xd|photoshop|adobe\s*photoshop|illustrator|adobe\s*illustrator|indesign|adobe\s*indesign|premiere|after\s*effects|blender|unity|unity3d|unreal\s*engine|unreal|vscode|visual\s*studio\s*code|visual\s*studio|intellij|intellij\s*idea|eclipse|xcode|android\s*studio|postman|insomnia|swagger|openapi|maven|gradle|npm|yarn|pnpm|webpack|vite|parcel|rollup|babel|eslint|prettier|jest|vitest)$/i,
            
            // Testing & Quality Assurance (enhanced patterns)
            /^(jest|vitest|mocha|jasmine|karma|protractor|testng|junit|pytest|pytest|rspec|cucumber|gherkin|selenium|selenium\s*webdriver|cypress|playwright|webdriverio|webdriver\s*io|puppeteer|unit\s*testing|integration\s*testing|e2e\s*testing|end\s*to\s*end\s*testing|automation\s*testing|manual\s*testing|load\s*testing|performance\s*testing|stress\s*testing|regression\s*testing|smoke\s*testing|acceptance\s*testing|tdd|test\s*driven\s*development|bdd|behavior\s*driven\s*development)$/i,
            
            // Data Science & AI/ML (comprehensive and modern)
            /^(machine\s*learning|deep\s*learning|artificial\s*intelligence|ai|ml|data\s*science|data\s*analysis|pandas|numpy|scipy|tensorflow|pytorch|scikit\s*learn|sklearn|keras|opencv|cv2|matplotlib|seaborn|plotly|bokeh|jupyter|jupyter\s*notebook|anaconda|conda|spyder|r\s*studio|rstudio|tableau|power\s*bi|powerbi|qlik|qlikview|qliksense|looker|databricks|spark|apache\s*spark|pyspark|hadoop|apache\s*hadoop|kafka|apache\s*kafka|airflow|apache\s*airflow|dbt|mlflow|kubeflow|tensorboard|wandb|weights\s*and\s*biases)$/i,
            
            // Mobile Development (comprehensive platforms)
            /^(ios|android|react\s*native|flutter|xamarin|xamarin\s*forms|ionic|cordova|phonegap|swift|objective\s*c|objective-c|kotlin|java|dart|flutter\s*dart|swiftui|swift\s*ui|jetpack\s*compose|unity\s*mobile|corona\s*sdk|titanium)$/i,
            
            // Operating Systems & Infrastructure (enhanced)
            /^(linux|ubuntu|centos|debian|fedora|redhat|rhel|red\s*hat|windows|windows\s*server|macos|mac\s*os|unix|freebsd|openbsd|arch|arch\s*linux|manjaro|alpine|alpine\s*linux|docker|containerization|virtualization|vmware|virtualbox|hyper\s*v|proxmox|xen)$/i,
            
            // Security & Networking (enhanced security focus)
            /^(cybersecurity|cyber\s*security|infosec|information\s*security|network\s*security|penetration\s*testing|pen\s*testing|ethical\s*hacking|white\s*hat\s*hacking|vulnerability\s*assessment|security\s*audit|tcp\/ip|http|https|ssl|tls|dns|dhcp|vpn|firewall|ipsec|oauth|oauth2|jwt|json\s*web\s*token|saml|ldap|active\s*directory|kerberos|encryption|cryptography|pki|public\s*key\s*infrastructure|zero\s*trust|siem|soar|ids|ips|waf|web\s*application\s*firewall)$/i,
            
            // Professional Soft Skills (validated and secure)
            /^(leadership|communication|teamwork|team\s*collaboration|project\s*management|problem\s*solving|analytical\s*thinking|critical\s*thinking|creative\s*thinking|strategic\s*thinking|collaboration|mentoring|coaching|presentation\s*skills|public\s*speaking|negotiation|time\s*management|conflict\s*resolution|decision\s*making|emotional\s*intelligence|adaptability|innovation|stakeholder\s*management|cross\s*functional\s*collaboration)$/i,
            
            // Methodologies & Best Practices (comprehensive)
            /^(agile|scrum|kanban|waterfall|lean|six\s*sigma|design\s*thinking|user\s*experience|ux|ui|user\s*interface|responsive\s*design|mobile\s*first|accessibility|wcag|a11y|tdd|test\s*driven\s*development|bdd|behavior\s*driven\s*development|ddd|domain\s*driven\s*design|solid\s*principles|clean\s*code|clean\s*architecture|refactoring|code\s*review|pair\s*programming|mob\s*programming|continuous\s*integration|continuous\s*deployment|microservices|micro\s*services|rest|restful|graphql|soap|api\s*design|api\s*development|event\s*driven\s*architecture|service\s*oriented\s*architecture|soa)$/i,
            
            // Business & Enterprise Tools (enhanced)
            /^(excel|microsoft\s*excel|powerpoint|microsoft\s*powerpoint|word|microsoft\s*word|outlook|microsoft\s*outlook|sharepoint|microsoft\s*sharepoint|teams|microsoft\s*teams|onenote|powerbi|power\s*bi|salesforce|hubspot|marketo|pardot|mailchimp|constant\s*contact|google\s*analytics|google\s*ads|google\s*adwords|facebook\s*ads|linkedin\s*ads|twitter\s*ads|seo|search\s*engine\s*optimization|sem|search\s*engine\s*marketing|ppc|pay\s*per\s*click|crm|customer\s*relationship\s*management|erp|enterprise\s*resource\s*planning|sap|oracle\s*ebs|netsuite|quickbooks|sage|xero|accounting|bookkeeping|financial\s*analysis|budgeting|forecasting|risk\s*management|compliance)$/i,
            
            // Design & Creative Tools (comprehensive)
            /^(photoshop|adobe\s*photoshop|illustrator|adobe\s*illustrator|indesign|adobe\s*indesign|lightroom|adobe\s*lightroom|premiere\s*pro|adobe\s*premiere|after\s*effects|adobe\s*after\s*effects|sketch|figma|adobe\s*xd|canva|gimp|inkscape|coreldraw|autocad|solidworks|maya|autodesk\s*maya|3ds\s*max|cinema\s*4d|blender|fusion\s*360|revit|sketchup|procreate|framer|principle|invision|zeplin|abstract|video\s*editing|motion\s*graphics|3d\s*modeling|animation|typography|branding|ui\/ux|ux\/ui|wireframing|prototyping|user\s*research|usability\s*testing)$/i,
            
            // Certifications (verified and legitimate only)
            /^(aws\s*certified|amazon\s*certified|azure\s*certified|microsoft\s*certified|google\s*certified|gcp\s*certified|pmp|project\s*management\s*professional|cissp|certified\s*information\s*systems\s*security\s*professional|comptia|comptia\s*security\+|comptia\s*network\+|comptia\s*a\+|cisco\s*certified|ccna|ccnp|ccie|oracle\s*certified|ocp|oca|itil|itil\s*foundation|iso\s*27001|scrum\s*master|certified\s*scrum\s*master|csm|product\s*owner|certified\s*product\s*owner|safe|scaled\s*agile|prince2|ceh|certified\s*ethical\s*hacker|cism|cisa|crisc|gsec|oscp|cissp)$/i,
            
            // Emerging Technologies (blockchain, IoT, etc.)
            /^(blockchain|distributed\s*ledger|ethereum|bitcoin|cryptocurrency|crypto|solidity|smart\s*contracts|web3|defi|decentralized\s*finance|nft|non\s*fungible\s*token|dao|decentralized\s*autonomous\s*organization|iot|internet\s*of\s*things|iiot|industrial\s*iot|edge\s*computing|5g|ar|augmented\s*reality|vr|virtual\s*reality|mixed\s*reality|mr|robotics|rpa|robotic\s*process\s*automation|automation|plc|programmable\s*logic\s*controller|scada|cad|computer\s*aided\s*design|cam|computer\s*aided\s*manufacturing|gis|geographic\s*information\s*systems|arcgis|qgis|revit|catia|ansys|simulink|labview|quantum\s*computing|computer\s*vision)$/i,
            
            // Content Management & E-commerce (enhanced)
            /^(wordpress|drupal|joomla|umbraco|sitecore|contentful|strapi|sanity|ghost|headless\s*cms|shopify|magento|woocommerce|prestashop|opencart|bigcommerce|squarespace|wix|webflow|bubble|no\s*code|low\s*code|zapier|integromat|make|airtable|notion|confluence|sharepoint)$/i,
            
            // Version Control & Collaboration (enhanced)
            /^(git|github|gitlab|bitbucket|svn|subversion|mercurial|perforce|tfs|team\s*foundation\s*server|azure\s*devops|jira|confluence|trello|asana|monday\.com|clickup|slack|discord|zoom|google\s*meet|microsoft\s*teams)$/i
        ];
    }

    // Initialize comprehensive blacklists
    initializeBlacklists() {
        this.secureBlacklist = new Set([
            // Basic stop words and connectors
            'and', 'or', 'with', 'using', 'the', 'a', 'an', 'in', 'on', 'at', 'for', 'by', 'from', 'to', 'of', 'as',
            'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
            'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who',
            
            // Work and experience terms
            'experience', 'work', 'working', 'worked', 'job', 'role', 'position', 'responsibilities', 'duties',
            'tasks', 'projects', 'project', 'team', 'company', 'organization', 'department', 'office',
            'apprenticeship', 'internship', 'trainee', 'intern', 'associate', 'assistant', 'coordinator',
            'employment', 'employer', 'employee', 'staff', 'personnel', 'workforce', 'colleague', 'coworker',
            
            // Educational noise
            'education', 'degree', 'bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate',
            'university', 'college', 'school', 'institute', 'institution', 'academy', 'program', 'course',
            'courses', 'coursework', 'study', 'studies', 'training', 'learning', 'curriculum', 'semester',
            'student', 'pupil', 'scholar', 'graduate', 'undergraduate', 'postgraduate', 'alumni', 'faculty',
            
            // Time and descriptive words
            'including', 'such', 'like', 'also', 'too', 'very', 'much', 'many', 'some', 'any', 'all',
            'years', 'year', 'months', 'month', 'weeks', 'week', 'days', 'day', 'time', 'times',
            'currently', 'previously', 'formerly', 'recently', 'now', 'then', 'today', 'yesterday', 'tomorrow',
            
            // Quality descriptors (not skills)
            'good', 'great', 'excellent', 'best', 'better', 'strong', 'solid', 'well', 'highly', 'very',
            'outstanding', 'exceptional', 'superior', 'quality', 'effective', 'efficient', 'successful',
            'poor', 'bad', 'weak', 'average', 'mediocre', 'fair', 'decent', 'adequate', 'satisfactory',
            
            // Meta skill terms
            'ability', 'abilities', 'skill', 'skills', 'knowledge', 'understanding', 'familiarity',
            'proficiency', 'competency', 'expertise', 'mastery', 'capability', 'talent', 'strength',
            
            // Common resume noise
            'resume', 'cv', 'curriculum', 'vitae', 'profile', 'summary', 'objective', 'goal',
            'developed', 'created', 'implemented', 'designed', 'built', 'worked', 'used', 'utilized',
            'applied', 'managed', 'led', 'coordinated', 'supervised', 'administered', 'maintained'
        ]);

        this.rejectionPatterns = [
            // Academic degrees and titles
            /^(jr|sr|ii|iii|iv|v|phd|md|ba|bs|ma|ms|mba|btech|mtech|be|me|bca|mca|bsc|msc|bcom|mcom|llb|llm|ca|cpa|cfa|frm|acca)$/i,
            // Time expressions
            /^\d+[\-\s]*\d*[\-\s]*(year|yr|month|mo|week|wk|day)s?$/i,
            // Experience levels
            /^(beginner|intermediate|advanced|expert|entry|mid|senior|junior)(\s*level)?$/i,
            // Grades and scores
            /^\d+\.?\d*\s*(cgpa|gpa|grade|%|percent|percentage)$/i,
            // Academic terms with numbers
            /^(semester|sem|quarter|term|session|batch|stream|section|division)\s*\d*$/i,
            // Years and dates
            /^(19|20)\d{2}$/i,
            /^\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4}$/i,
            // Single characters
            /^[a-z]$/i,
            // Common phrases
            /^(responsible\s*for|worked\s*on|experience\s*in|knowledge\s*of|familiar\s*with)$/i,
            /^(team\s*player|self\s*motivated|detail\s*oriented|results\s*driven|goal\s*oriented)$/i,
            // Company suffixes
            /\b(inc|ltd|llc|corp|pvt|co|company|technologies|solutions|systems|services|consulting|group|international|global)$/i,
            // Location terms
            /\b(street|road|avenue|lane|drive|blvd|boulevard|plaza|square|circle|way|court|place|floor|building|suite|apt|apartment|room|office)$/i
        ];
    }

    // Main validation function with security layers
    validateSkill(skill) {
        try {
            // Input sanitization and security check
            if (!this.isSecureInput(skill)) {
                console.warn('Security validation failed for skill:', skill);
                return false;
            }

            // Normalize the skill
            const normalizedSkill = this.normalizeSkill(skill);
            if (!normalizedSkill) return false;

            // Basic validation
            if (!this.basicValidation(normalizedSkill)) return false;

            // Entropy check for meaningful content
            if (!this.entropyValidation(normalizedSkill)) return false;

            // Pattern-based legitimate skill validation
            if (!this.patternValidation(normalizedSkill)) return false;

            // Blacklist validation
            if (!this.blacklistValidation(normalizedSkill)) return false;

            // Final composition check
            if (!this.compositionValidation(normalizedSkill)) return false;

            return true;

        } catch (error) {
            console.error('Skill validation error:', error);
            return false; // Fail safe
        }
    }

    // Security validation to prevent XSS and injection attacks
    isSecureInput(input) {
        if (typeof input !== 'string') return false;

        // Check for XSS patterns
        for (const pattern of this.securityPatterns.xssPatterns) {
            if (pattern.test(input)) return false;
        }

        // Check for injection patterns
        for (const pattern of this.securityPatterns.injectionPatterns) {
            if (pattern.test(input)) return false;
        }

        // Check for malicious patterns
        for (const pattern of this.securityPatterns.maliciousPatterns) {
            if (pattern.test(input)) return false;
        }

        return true;
    }

    // Normalize and clean skill input
    normalizeSkill(skill) {
        if (!skill || typeof skill !== 'string') return '';

        // Security cleaning
        let cleaned = skill;
        for (const pattern of this.securityPatterns.injectionPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // Normalize whitespace and case
        cleaned = cleaned.trim().toLowerCase();

        // Remove common prefixes and suffixes
        cleaned = cleaned
            .replace(/^(with\s+|using\s+|experience\s+with\s+|knowledge\s+of\s+|familiar\s+with\s+|proficient\s+in\s+|skilled\s+in\s+)/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    // Basic validation checks
    basicValidation(skill) {
        // Length check
        if (skill.length < 2 || skill.length > 50) return false;

        // Not just numbers
        if (/^\d+$/.test(skill)) return false;

        // Not percentages or ratios
        if (/^\d+\.?\d*\s*%?$/.test(skill)) return false;
        if (/^\d+\.?\d*\s*\/\s*\d+\.?\d*$/.test(skill)) return false;

        return true;
    }

    // Entropy validation for meaningful content
    entropyValidation(skill) {
        const entropy = this.calculateStringEntropy(skill);
        return entropy >= 1.5; // Reject low-entropy strings like "aaa", "123"
    }

    // Pattern-based validation against legitimate skills
    patternValidation(skill) {
        // Check against legitimate skill patterns
        const isLegitimate = this.legitimateSkillPatterns.some(pattern => {
            try {
                return pattern.test(skill);
            } catch (e) {
                console.warn('Pattern validation error:', e);
                return false;
            }
        });

        if (isLegitimate) return true;

        // Check compound skills as fallback
        const compoundSkills = [
            /^(full[\s\-]?stack|front[\s\-]?end|back[\s\-]?end)(\s*developer)?$/i,
            /^(web|mobile|software|app|game)\s*development$/i,
            /^(data|business|system|requirements)\s*analysis$/i,
            /^(technical|team|solution)\s*(lead|architect)$/i,
            /^(quality\s*assurance|performance\s*testing|load\s*testing)$/i,
            /^(digital|content|social\s*media|email)\s*marketing$/i,
            /^(customer\s*service|client\s*relations|account\s*management)$/i
        ];

        return compoundSkills.some(pattern => {
            try {
                return pattern.test(skill);
            } catch (e) {
                console.warn('Compound skill validation error:', e);
                return false;
            }
        });
    }

    // Blacklist validation
    blacklistValidation(skill) {
        // Check secure blacklist
        if (this.secureBlacklist.has(skill)) return false;

        // Check rejection patterns
        for (const pattern of this.rejectionPatterns) {
            try {
                if (pattern.test(skill)) return false;
            } catch (e) {
                console.warn('Blacklist pattern error:', e);
                return false;
            }
        }

        return true;
    }

    // Character composition validation
    compositionValidation(skill) {
        // Ensure mostly alphabetic characters
        const alphaRatio = (skill.match(/[a-zA-Z]/g) || []).length / skill.length;
        if (alphaRatio < 0.6) return false;

        // Check for excessive special characters
        const specialCharRatio = (skill.match(/[^a-zA-Z0-9\s\-\.]/g) || []).length / skill.length;
        if (specialCharRatio > 0.3) return false;

        return true;
    }

    // Calculate string entropy for complexity analysis
    calculateStringEntropy(str) {
        const freq = {};
        for (let char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }

        let entropy = 0;
        const len = str.length;
        for (let char in freq) {
            const p = freq[char] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    // Auto-correct common skill misspellings
    autoCorrectSkill(skill) {
        const corrections = {
            'javascrit': 'javascript',
            'java script': 'javascript',
            'type script': 'typescript',
            'node js': 'nodejs',
            'react js': 'react',
            'angular js': 'angular',
            'vue js': 'vue',
            'express js': 'express',
            'mongo db': 'mongodb',
            'postgre sql': 'postgresql',
            'my sql': 'mysql',
            'git hub': 'github',
            'git lab': 'gitlab',
            'docker container': 'docker',
            'kubernettes': 'kubernetes',
            'amazone web services': 'aws',
            'google cloud platform': 'gcp',
            'microsoft azure': 'azure'
        };

        return corrections[skill.toLowerCase()] || skill;
    }

    // Batch validation for multiple skills
    validateSkills(skills) {
        if (!Array.isArray(skills)) return [];

        return skills
            .map(skill => this.autoCorrectSkill(skill))
            .filter(skill => this.validateSkill(skill))
            .filter((skill, index, array) => array.indexOf(skill) === index); // Remove duplicates
    }

    // Get validation report for debugging
    getValidationReport(skill) {
        const report = {
            original: skill,
            secure: this.isSecureInput(skill),
            normalized: this.normalizeSkill(skill),
            basicValid: false,
            entropyValid: false,
            patternValid: false,
            blacklistValid: false,
            compositionValid: false,
            finalValid: false
        };

        const normalized = report.normalized;
        if (normalized) {
            report.basicValid = this.basicValidation(normalized);
            report.entropyValid = this.entropyValidation(normalized);
            report.patternValid = this.patternValidation(normalized);
            report.blacklistValid = this.blacklistValidation(normalized);
            report.compositionValid = this.compositionValidation(normalized);
            report.finalValid = report.basicValid && report.entropyValid && 
                               report.patternValid && report.blacklistValid && report.compositionValid;
        }

        return report;
    }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSkillValidator;
} else if (typeof window !== 'undefined') {
    window.AdvancedSkillValidator = AdvancedSkillValidator;
}
