const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const chalk = require('chalk');
const readline = require('readline');

// CONFIG
const CONFIG = {
    studentsFile: process.env.STUDENTS_FILE || 'students.txt',
    receiptsDir: process.env.RECEIPTS_DIR || 'receipts',
    collegesFile: process.env.COLLEGES_FILE,
    outputFile: process.env.OUTPUT_FILE || 'sukses.txt'
};

if (!CONFIG.collegesFile) {
    CONFIG.collegesFile = 'sheerid_us.json';
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askForVerificationId() {
    return new Promise((resolve) => {
        rl.question(chalk.yellow('🔑 Enter Verification ID: '), (answer) => {
            resolve(answer.trim());
        });
    });
}

// LOAD STUDENTS
function loadStudents() {
    try {
        const content = fs.readFileSync(CONFIG.studentsFile, 'utf-8');
        return content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split('|').map(s => s.trim());
                if (parts.length < 4) return null;

                const [school, firstNameRaw, lastNameRaw, emailRaw] = parts;
                const firstName = firstNameRaw || 'TEST';
                const lastName = lastNameRaw || 'USER';
                const email = emailRaw || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

                return {
                    school,
                    firstName: firstName.toUpperCase(),
                    lastName: lastName.toUpperCase(),
                    email: email.toLowerCase()
                };
            })
            .filter(s => s);
    } catch (e) {
        console.log(chalk.red('❌ Error loading students'));
        return [];
    }
}

// LOAD COLLEGES
function loadColleges() {
    try {
        const data = JSON.parse(fs.readFileSync(CONFIG.collegesFile, 'utf-8'));
        const map = new Map();
        data.forEach(c => map.set(c.id, c));
        return map;
    } catch (e) {
        console.log(chalk.red(`❌ Error loading colleges from ${CONFIG.collegesFile}`));
        return new Map();
    }
}

// MATCH COLLEGE BY NAME
function normalizeName(name) {
    if (!name) return '';
    // Remove any parenthetical location info and non-alphanumeric separators
    return name
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

function findCollegeByName(collegesMap, schoolName) {
    const target = normalizeName(schoolName);
    if (!target) return null;

    let partialMatch = null;

    for (const college of collegesMap.values()) {
        const normalizedCollege = normalizeName(college.name);

        if (normalizedCollege === target) {
            return college;
        }

        if (!partialMatch && (normalizedCollege.includes(target) || target.includes(normalizedCollege))) {
            partialMatch = college;
        }
    }

    return partialMatch;
}

// DEBUG: Get full verification details
async function getVerificationDetails(verificationId) {
    try {
        const response = await axios.get(
            `https://services.sheerid.com/rest/v2/verification/${verificationId}`,
            {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );
        console.log(chalk.cyan('🔍 Verification Details:'));
        console.log(chalk.cyan(`Status: ${response.data.status}`));
        console.log(chalk.cyan(`Current Step: ${response.data.currentStep}`));
        console.log(chalk.cyan(`Created: ${response.data.created}`));
        console.log(chalk.cyan(`Updated: ${response.data.updated}`));
        console.log(chalk.cyan(`Organization: ${response.data.organization?.name || 'None'}`));
        return response.data;
    } catch (e) {
        console.log(chalk.red('❌ Failed to get verification details'));
        return null;
    }
}

// ACTUALLY SUBMIT PERSONAL INFO WITH VERIFICATION ID
async function submitPersonalInfo(verificationId, student, college) {
    try {
        const dob = {
            year: new Date().getFullYear() - Math.floor(Math.random() * 8) - 18,
            month: Math.floor(Math.random() * 12) + 1,
            day: Math.floor(Math.random() * 28) + 1
        };
        
        const data = {
            firstName: student.firstName,
            lastName: student.lastName,
            birthDate: `${dob.year}-${dob.month.toString().padStart(2, '0')}-${dob.day.toString().padStart(2, '0')}`,
            email: student.email,
            organization: {
                id: college.id,
                name: college.name
            }
        };
        
        console.log(chalk.yellow('📝 Actually submitting personal info to SheerID...'));
        
        const response = await axios.post(
            `https://services.sheerid.com/rest/v2/verification/${verificationId}/step/collectStudentPersonalInfo`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 30000
            }
        );
        
        console.log(chalk.green(`✅ Personal info submitted!`));
        console.log(chalk.green(`New step: ${response.data.currentStep}`));
        
        return {
            success: true,
            currentStep: response.data.currentStep
        };
    } catch (e) {
        console.log(chalk.red('❌ Failed to submit personal info'));
        if (e.response) {
            console.log(chalk.red(`Status: ${e.response.status}`));
            console.log(chalk.red(`Error: ${JSON.stringify(e.response.data)}`));
        }
        return { success: false };
    }
}

// CHECK STATUS
async function checkStatus(verificationId) {
    try {
        const response = await axios.get(
            `https://services.sheerid.com/rest/v2/verification/${verificationId}`,
            {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );
        console.log(chalk.blue(`📍 Current Step: ${response.data.currentStep}`));
        return { 
            success: true, 
            currentStep: response.data.currentStep,
            data: response.data 
        };
    } catch (e) {
        console.log(chalk.red('❌ Could not check status'));
        return { success: false };
    }
}

// CANCEL SSO
async function cancelSso(verificationId) {
    try {
        console.log(chalk.yellow('🔄 Cancelling SSO...'));
        const response = await axios.delete(
            `https://services.sheerid.com/rest/v2/verification/${verificationId}/step/sso`,
            {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );
        console.log(chalk.green('✅ SSO cancelled'));
        console.log(chalk.green(`New step: ${response.data.currentStep}`));
        return { success: true, currentStep: response.data.currentStep };
    } catch (e) {
        console.log(chalk.red('❌ SSO cancel failed'));
        if (e.response) {
            console.log(chalk.red(`Status: ${e.response.status}`));
        }
        return { success: false };
    }
}

// UPLOAD DOCUMENT
async function uploadDocument(verificationId, filePath) {
    try {
        console.log(chalk.yellow(`📤 Uploading: ${path.basename(filePath)}`));
        const url = `https://services.sheerid.com/rest/v2/verification/${verificationId}/step/docUpload`;
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        
        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 60000
        });
        
        console.log(chalk.green('✅ Upload successful!'));
        console.log(chalk.green(`New step: ${response.data.currentStep}`));
        return { success: true, data: response.data };
    } catch (e) {
        console.log(chalk.red('❌ Upload failed'));
        if (e.response) {
            console.log(chalk.red(`Status: ${e.response.status}`));
            console.log(chalk.red(`Error: ${e.response.data?.message || 'Unknown error'}`));
        }
        return { success: false };
    }
}

// GET google URL
async function getgoogleUrl(verificationId) {
    try {
        console.log(chalk.yellow('🔗 Getting google URL...'));
        const response = await axios.get(
            `https://services.sheerid.com/rest/v2/verification/${verificationId}/redirect`,
            { 
                maxRedirects: 0, 
                timeout: 10000,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept redirects
                }
            }
        );
        
        if (response.headers.location) {
            console.log(chalk.green(`✅ google URL obtained!`));
            return { success: true, url: response.headers.location };
        }
    } catch (e) {
        if (e.response?.headers?.location) {
            console.log(chalk.green(`✅ google URL obtained!`));
            return { success: true, url: e.response.headers.location };
        }
        console.log(chalk.red('❌ Failed to get GOOGLE URL'));
    }
    return { success: false };
}

// SAVE RESULT
function saveResult(url) {
    try {
        fs.appendFileSync(CONFIG.outputFile, url + '\n');
        console.log(chalk.green(`💾 Saved to file: ${url}`));
    } catch (e) {
        console.log(chalk.red('❌ Save failed'));
    }
}

// PROCESS STUDENT WITH PROVIDED VERIFICATION ID
async function processStudent(student, collegesMap, verificationId) {
    console.log(chalk.cyan(`\n🎯 Processing: ${student.firstName} ${student.lastName}`));

    // Debug: Show verification details
    await getVerificationDetails(verificationId);

    // Get college info by name
    const college = findCollegeByName(collegesMap, student.school);
    if (!college) {
        console.log(chalk.red(`❌ School not found in database: ${student.school || 'Unknown'}`));
        return null;
    }

    console.log(chalk.blue(`🏫 College: ${college.name}`));
    
    // STEP 1: Submit personal info (if needed)
    const check = await checkStatus(verificationId);
    if (!check.success) {
        console.log(chalk.red('❌ Cannot proceed - verification not found'));
        return null;
    }
    
    // If stuck at collectStudentPersonalInfo, submit the form
    if (check.currentStep === 'collectStudentPersonalInfo') {
        console.log(chalk.yellow('🔄 Verification stuck at initial step, submitting info...'));
        const submitResult = await submitPersonalInfo(verificationId, student, college);
        if (!submitResult.success) {
            console.log(chalk.red('❌ Failed to submit personal info'));
            return null;
        }
        
        // Wait for processing
        console.log(chalk.yellow('⏳ Waiting for processing...'));
        await new Promise(r => setTimeout(r, 3000));
        
        // Check new status
        await checkStatus(verificationId);
    }
    
    // Check status again
    const status = await checkStatus(verificationId);
    if (!status.success) return null;
    
    let currentStep = status.currentStep;
    
    // STEP 2: Handle SSO if needed
    if (currentStep === 'sso') {
        const ssoResult = await cancelSso(verificationId);
        if (ssoResult.success) {
            currentStep = ssoResult.currentStep;
            await new Promise(r => setTimeout(r, 2000));
            const newStatus = await checkStatus(verificationId);
            if (newStatus.success) currentStep = newStatus.currentStep;
        }
    }
    
    // STEP 3: Upload document if at docUpload step
    if (currentStep === 'docUpload') {
        console.log(chalk.red('❌ Document upload step reached, but no documents are configured.'));
        return null;
    } else if (currentStep === 'success') {
        // Already verified, just get URL
        console.log(chalk.green('✅ Already verified! Getting google URL...'));
        const googleResult = await getgoogleUrl(verificationId);
        if (googleResult.success) {
            saveResult(googleResult.url);
            return googleResult.url;
        }
    } else {
        console.log(chalk.red(`❌ Cannot proceed. Current step: ${currentStep}`));
        console.log(chalk.yellow(`Expected: docUpload or success, Got: ${currentStep}`));
    }
    
    return null;
}

// MAIN
async function main() {
    console.log(chalk.cyan('🎵 google Verification (DEBUG MODE) 🎵'));
    
    // Ask for verification ID
    const verificationId = await askForVerificationId();
    if (!verificationId) {
        console.log(chalk.red('❌ No verification ID provided'));
        rl.close();
        return;
    }
    
    console.log(chalk.green(`🔑 Using Verification ID: ${verificationId}`));
    console.log(chalk.green(`📚 Colleges file: ${CONFIG.collegesFile}`));
    
    // Load colleges
    const collegesMap = loadColleges();
    if (collegesMap.size === 0) {
        console.log(chalk.red('❌ Need colleges file'));
        rl.close();
        return;
    }
    
    // Load students
    const students = loadStudents();
    if (students.length === 0) {
        console.log(chalk.red('❌ No students'));
        rl.close();
        return;
    }
    
    console.log(chalk.green(`👥 Students: ${students.length}`));
    console.log(chalk.green(`🏫 Colleges: ${collegesMap.size}`));
    
    // Process each student
    for (const student of students) {
        console.log(chalk.cyan('\n' + '='.repeat(50)));
        const result = await processStudent(student, collegesMap, verificationId);
        
        if (result) {
            console.log(chalk.green(`🎉 Success! google URL: ${result}`));
        } else {
            console.log(chalk.red(`❌ Failed for ${student.firstName}`));
        }
        
        // Delay between students
        if (students.indexOf(student) < students.length - 1) {
            console.log(chalk.yellow('⏳ Waiting before next student...'));
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(50)));
    console.log(chalk.cyan('✅ All processing complete'));
    rl.close();
}

// RUN
if (require.main === module) {
    main().catch(e => {
        console.error(chalk.red('💥 Fatal Error:'), e.message);
        if (e.response) {
            console.error(chalk.red('Response:'), e.response.status, e.response.data);
        }
        rl.close();
        process.exit(1);
    });
}