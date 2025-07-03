// CREATED: 2025-07-03 - Script to copy PDF worker files to public directory

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyPdfWorker() {
  try {
    console.log('🔧 Setting up PDF.js worker files...');
    
    // Define paths
    const projectRoot = path.dirname(__dirname);
    const nodeModulesPath = path.join(projectRoot, 'node_modules');
    const publicPath = path.join(projectRoot, 'public');
    const pdfjsDistPath = path.join(nodeModulesPath, 'pdfjs-dist');
    
    // Check if pdfjs-dist exists
    try {
      await fs.access(pdfjsDistPath);
    } catch {
      console.error('❌ pdfjs-dist not found in node_modules. Please install dependencies first.');
      process.exit(1);
    }
    
    // Get pdfjs-dist version
    const packageJsonPath = path.join(pdfjsDistPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    console.log(`📦 pdfjs-dist version: ${version}`);
    
    // Create public directory if it doesn't exist
    await fs.mkdir(publicPath, { recursive: true });
    
    // Define source and destination paths
    const workerSources = [
      {
        src: path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs'),
        dest: path.join(publicPath, 'pdf.worker.min.mjs'),
        required: true,
      },
      {
        src: path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js'),
        dest: path.join(publicPath, 'pdf.worker.min.js'),
        required: false,
      },
      {
        src: path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs'),
        dest: path.join(publicPath, 'pdf.worker.mjs'),
        required: false,
      },
    ];
    
    // Copy worker files
    let copiedFiles = 0;
    for (const { src, dest, required } of workerSources) {
      try {
        await fs.access(src);
        await fs.copyFile(src, dest);
        console.log(`✅ Copied: ${path.basename(src)}`);
        copiedFiles++;
      } catch (error) {
        if (required) {
          console.error(`❌ Required worker file not found: ${src}`);
          throw error;
        } else {
          console.log(`⚠️  Optional worker file not found: ${path.basename(src)}`);
        }
      }
    }
    
    // Copy cMaps (for better PDF text extraction)
    const cmapsDir = path.join(pdfjsDistPath, 'cmaps');
    const publicCmapsDir = path.join(publicPath, 'cmaps');
    
    try {
      await fs.access(cmapsDir);
      
      // Remove existing cmaps directory
      try {
        await fs.rm(publicCmapsDir, { recursive: true, force: true });
      } catch {}
      
      // Copy cmaps directory
      await copyDirectory(cmapsDir, publicCmapsDir);
      console.log('✅ Copied: cmaps directory');
      copiedFiles++;
    } catch (error) {
      console.log('⚠️  cMaps directory not found (optional)');
    }
    
    // Copy standard fonts (for better PDF font support)
    const standardFontsDir = path.join(pdfjsDistPath, 'standard_fonts');
    const publicStandardFontsDir = path.join(publicPath, 'standard_fonts');
    
    try {
      await fs.access(standardFontsDir);
      
      // Remove existing standard_fonts directory
      try {
        await fs.rm(publicStandardFontsDir, { recursive: true, force: true });
      } catch {}
      
      // Copy standard_fonts directory
      await copyDirectory(standardFontsDir, publicStandardFontsDir);
      console.log('✅ Copied: standard_fonts directory');
      copiedFiles++;
    } catch (error) {
      console.log('⚠️  Standard fonts directory not found (optional)');
    }
    
    // Create a version info file
    const versionInfo = {
      version,
      timestamp: new Date().toISOString(),
      files: copiedFiles,
      worker: 'pdf.worker.min.mjs',
    };
    
    await fs.writeFile(
      path.join(publicPath, 'pdf-version-info.json'),
      JSON.stringify(versionInfo, null, 2),
      'utf8'
    );
    
    console.log(`🎉 PDF.js setup complete! Copied ${copiedFiles} files/directories.`);
    console.log(`💡 Worker source: /pdf.worker.min.mjs`);
    
  } catch (error) {
    console.error('❌ Failed to setup PDF.js worker:', error);
    process.exit(1);
  }
}

// Helper function to copy directory recursively
async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run the script
copyPdfWorker();