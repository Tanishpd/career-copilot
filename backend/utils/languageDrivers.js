
/**
 * Language Drivers to wrap user code with input/output handling
 */

export const generateDriver = (language, userCode, structure) => {
    switch (language.toLowerCase()) {
        case 'javascript':
            return generateJsDriver(userCode, structure);
        case 'python':
            return generatePythonDriver(userCode, structure);
        case 'java':
            return generateJavaDriver(userCode, structure);
        case 'cpp':
        case 'c++':
            return generateCppDriver(userCode, structure);
        default:
            throw new Error(`Unsupported language: ${language}`);
    }
};

const generateJsDriver = (userCode, structure) => {
    const params = structure.parameters.map(p => p.name).join(', ');
    const paramReads = structure.parameters.map(p => {
        if (p.type.includes('[]')) {
            return `JSON.parse(lines.shift())`;
        } else if (p.type === 'int' || p.type === 'float') {
            return `Number(lines.shift())`;
        } else {
            return `lines.shift()`;
        }
    }).join(', ');

    return `
${userCode}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
const lines = input;

// Auto-generated driver
try {
    const args = [${paramReads}];
    const result = ${structure.functionName}(...args);
    console.log(JSON.stringify(result));
} catch (e) {
    console.error(e);
}
`;
};

const generatePythonDriver = (userCode, structure) => {
    const paramReads = structure.parameters.map(p => {
        if (p.type === 'int') return `int(input())`;
        if (p.type === 'float') return `float(input())`;
        if (p.type.includes('[]')) return `json.loads(input())`; // arrays as json strings
        return `input()`;
    }).join(', ');

    return `
import sys
import json

${userCode}

if __name__ == "__main__":
    try:
        sol = Solution()
        args = [${paramReads}]
        result = sol.${structure.functionName}(*args)
        print(json.dumps(result) if isinstance(result, (list, dict)) else result)
    except Exception as e:
        print(e, file=sys.stderr)
`;
};

const generateJavaDriver = (userCode, structure) => {
    // Basic types support: int, string, int[], string[]
    // Input format assumption: Each argument on a new line

    const readLogic = structure.parameters.map(p => {
        const type = p.type;
        const name = p.name;
        if (type === 'int') return `int ${name} = Integer.parseInt(sc.nextLine().trim());`;
        if (type === 'String') return `String ${name} = sc.nextLine().trim();`;
        if (type === 'int[]') return `int[] ${name} = parseIntArray(sc.nextLine().trim());`;
        // Add more as needed
        return `// Unsupported type ${type}`;
    }).join('\n        ');

    const args = structure.parameters.map(p => p.name).join(', ');

    return `
import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        try {
            ${readLogic}
            
            Solution sol = new Solution();
            Object result = sol.${structure.functionName}(${args});
            
            System.out.println(result);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private static int[] parseIntArray(String s) {
        if (s.equals("[]")) return new int[0];
        String[] parts = s.substring(1, s.length()-1).split(",");
        int[] arr = new int[parts.length];
        for (int i=0; i<parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }
}
`;
};

const generateCppDriver = (userCode, structure) => {
    // C++ is tricky with strings/arrays parsing from raw line.
    // Simplifying assumption: Standard Cin

    const readLogic = structure.parameters.map(p => {
        const type = p.type;
        const name = p.name; // int x
        if (type === 'int') return `int ${name}; cin >> ${name};`;
        if (type === 'string') return `string ${name}; cin >> ${name};`;
        if (type === 'vector<int>') return `
            int n_${name}; cin >> n_${name};
            vector<int> ${name}(n_${name});
            for(int i=0; i<n_${name}; i++) cin >> ${name}[i];
        `;
        return `// Unsupported type ${type}`;
    }).join('\n        ');

    const args = structure.parameters.map(p => p.name).join(', ');

    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>

using namespace std;

${userCode}

int main() {
    ${readLogic}
    
    Solution sol;
    cout << sol.${structure.functionName}(${args}) << endl;
    return 0;
}
`;
};
