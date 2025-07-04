// Local storage implementation for templates

import {
  TemplateStorage,
  DocuBrandTemplate,
  TemplateLibraryEntry,
  TemplateCategory,
  TemplateMetadata
} from '../types/template-types';

/**
 * Local storage implementation for templates
 * Uses browser localStorage for persistence
 */
export class LocalTemplateStorage implements TemplateStorage {
  private readonly storageKey = 'docubrand_templates';
  private readonly metadataKey = 'docubrand_template_metadata';
  private templatesCache: Map<string, DocuBrandTemplate> = new Map();
  private metadataCache: Map<string, TemplateLibraryEntry> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Save template to storage
   */
  public async save(template: DocuBrandTemplate): Promise<void> {
    console.log(`💾 Saving template: ${template.id}`);
    
    try {
      // Update cache
      this.templatesCache.set(template.id, template);
      
      // Create or update metadata entry
      const entry = this.createLibraryEntry(template);
      this.metadataCache.set(template.id, entry);
      
      // Save to localStorage
      await this.saveToStorage();
      
      console.log('✅ Template saved successfully');
      
    } catch (error) {
      console.error('❌ Template save failed:', error);
      throw error;
    }
  }

  /**
   * Load template from storage
   */
  public async load(id: string): Promise<DocuBrandTemplate | null> {
    console.log(`📁 Loading template: ${id}`);
    
    try {
      const template = this.templatesCache.get(id);
      
      if (template) {
        console.log('✅ Template loaded from cache');
        return template;
      }
      
      // Try to load from localStorage
      await this.loadFromStorage();
      const retryTemplate = this.templatesCache.get(id);
      
      if (retryTemplate) {
        console.log('✅ Template loaded from storage');
        return retryTemplate;
      }
      
      console.warn('⚠️ Template not found');
      return null;
      
    } catch (error) {
      console.error('❌ Template load failed:', error);
      return null;
    }
  }

  /**
   * Delete template from storage
   */
  public async delete(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting template: ${id}`);
    
    try {
      const existed = this.templatesCache.has(id);
      
      if (!existed) {
        console.warn('⚠️ Template not found for deletion');
        return false;
      }
      
      // Remove from cache
      this.templatesCache.delete(id);
      this.metadataCache.delete(id);
      
      // Save to localStorage
      await this.saveToStorage();
      
      console.log('✅ Template deleted successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Template deletion failed:', error);
      return false;
    }
  }

  /**
   * List all templates
   */
  public async list(): Promise<TemplateLibraryEntry[]> {
    console.log('📋 Listing all templates');
    
    try {
      await this.loadFromStorage();
      
      const entries = Array.from(this.metadataCache.values());
      
      // Sort by last updated
      entries.sort((a, b) => 
        new Date(b.metadata.lastUpdated || 0).getTime() - 
        new Date(a.metadata.lastUpdated || 0).getTime()
      );
      
      console.log(`✅ Found ${entries.length} templates`);
      return entries;
      
    } catch (error) {
      console.error('❌ Template listing failed:', error);
      return [];
    }
  }

  /**
   * Find templates by category
   */
  public async findByCategory(category: TemplateCategory): Promise<TemplateLibraryEntry[]> {
    console.log(`🔍 Finding templates by category: ${category}`);
    
    try {
      const allTemplates = await this.list();
      const filtered = allTemplates.filter(template => template.category === category);
      
      console.log(`✅ Found ${filtered.length} templates in category ${category}`);
      return filtered;
      
    } catch (error) {
      console.error('❌ Category search failed:', error);
      return [];
    }
  }

  /**
   * Find templates by tags
   */
  public async findByTags(tags: string[]): Promise<TemplateLibraryEntry[]> {
    console.log(`🔍 Finding templates by tags: ${tags.join(', ')}`);
    
    try {
      const allTemplates = await this.list();
      const filtered = allTemplates.filter(template => 
        tags.some(tag => template.tags.includes(tag))
      );
      
      console.log(`✅ Found ${filtered.length} templates with matching tags`);
      return filtered;
      
    } catch (error) {
      console.error('❌ Tag search failed:', error);
      return [];
    }
  }

  /**
   * Search templates by query
   */
  public async search(query: string): Promise<TemplateLibraryEntry[]> {
    console.log(`🔍 Searching templates: "${query}"`);
    
    try {
      const allTemplates = await this.list();
      const normalizedQuery = query.toLowerCase();
      
      const filtered = allTemplates.filter(template => 
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        template.category.toLowerCase().includes(normalizedQuery)
      );
      
      console.log(`✅ Found ${filtered.length} templates matching "${query}"`);
      return filtered;
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }

  /**
   * Update template metadata
   */
  public async updateMetadata(id: string, metadata: Partial<TemplateMetadata>): Promise<void> {
    console.log(`📝 Updating metadata for template: ${id}`);
    
    try {
      const template = await this.load(id);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Update template metadata
      template.metadata = { ...template.metadata, ...metadata };
      template.metadata.updatedAt = new Date().toISOString();
      
      // Save updated template
      await this.save(template);
      
      console.log('✅ Metadata updated successfully');
      
    } catch (error) {
      console.error('❌ Metadata update failed:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  public async getUsageStats(id: string): Promise<any> {
    console.log(`📊 Getting usage stats for template: ${id}`);
    
    try {
      const entry = this.metadataCache.get(id);
      
      if (!entry) {
        throw new Error('Template not found');
      }
      
      return {
        downloads: entry.usage.downloads,
        rating: entry.usage.rating,
        reviews: entry.usage.reviews,
        lastUpdated: entry.usage.lastUpdated
      };
      
    } catch (error) {
      console.error('❌ Usage stats retrieval failed:', error);
      return {
        downloads: 0,
        rating: 0,
        reviews: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Export templates for backup
   */
  public async exportTemplates(): Promise<string> {
    console.log('📤 Exporting templates');
    
    try {
      const allTemplates = Array.from(this.templatesCache.values());
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        templates: allTemplates
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log(`✅ Exported ${allTemplates.length} templates`);
      
      return jsonString;
      
    } catch (error) {
      console.error('❌ Template export failed:', error);
      throw error;
    }
  }

  /**
   * Import templates from backup
   */
  public async importTemplates(jsonString: string): Promise<number> {
    console.log('📥 Importing templates');
    
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.templates || !Array.isArray(importData.templates)) {
        throw new Error('Invalid import data format');
      }
      
      let importedCount = 0;
      
      for (const template of importData.templates) {
        try {
          // Generate new ID to avoid conflicts
          const newId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          template.id = newId;
          template.metadata.updatedAt = new Date().toISOString();
          
          await this.save(template);
          importedCount++;
          
        } catch (error) {
          console.warn('⚠️ Failed to import template:', template.name, error);
        }
      }
      
      console.log(`✅ Imported ${importedCount} templates`);
      return importedCount;
      
    } catch (error) {
      console.error('❌ Template import failed:', error);
      throw error;
    }
  }

  /**
   * Clear all templates (for testing)
   */
  public async clearAll(): Promise<void> {
    console.log('🧹 Clearing all templates');
    
    try {
      this.templatesCache.clear();
      this.metadataCache.clear();
      
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.metadataKey);
      
      console.log('✅ All templates cleared');
      
    } catch (error) {
      console.error('❌ Clear all failed:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<any> {
    try {
      const templateCount = this.templatesCache.size;
      const storageSize = this.calculateStorageSize();
      
      // Calculate categories
      const categories = Array.from(this.metadataCache.values())
        .reduce((acc, entry) => {
          acc[entry.category] = (acc[entry.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      return {
        templateCount,
        storageSize,
        categories,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Storage stats failed:', error);
      return {
        templateCount: 0,
        storageSize: 0,
        categories: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Private helper methods
   */
  private async loadFromStorage(): Promise<void> {
    try {
      // Load templates
      const templatesData = localStorage.getItem(this.storageKey);
      if (templatesData) {
        const templates = JSON.parse(templatesData);
        this.templatesCache = new Map(Object.entries(templates));
      }
      
      // Load metadata
      const metadataData = localStorage.getItem(this.metadataKey);
      if (metadataData) {
        const metadata = JSON.parse(metadataData);
        this.metadataCache = new Map(Object.entries(metadata));
      }
      
    } catch (error) {
      console.error('❌ Loading from storage failed:', error);
      // Initialize empty caches
      this.templatesCache = new Map();
      this.metadataCache = new Map();
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      // Save templates
      const templatesObj = Object.fromEntries(this.templatesCache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(templatesObj));
      
      // Save metadata
      const metadataObj = Object.fromEntries(this.metadataCache.entries());
      localStorage.setItem(this.metadataKey, JSON.stringify(metadataObj));
      
    } catch (error) {
      console.error('❌ Saving to storage failed:', error);
      throw error;
    }
  }

  private createLibraryEntry(template: DocuBrandTemplate): TemplateLibraryEntry {
    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      thumbnail: template.metadata.thumbnail || '',
      previewImages: template.metadata.previewImages || [],
      tags: template.tags,
      
      usage: {
        downloads: 0,
        rating: 0,
        reviews: 0,
        lastUpdated: template.metadata.updatedAt
      },
      
      metadata: {
        author: template.metadata.author,
        version: template.version,
        fileSize: this.calculateTemplateSize(template),
        supportedLanguages: template.i18nConfig.supportedLanguages,
        difficulty: template.metadata.educational?.difficulty || 'intermediate'
      },
      
      templateData: template
    };
  }

  private calculateTemplateSize(template: DocuBrandTemplate): number {
    try {
      const jsonString = JSON.stringify(template);
      return new Blob([jsonString]).size;
      
    } catch (error) {
      console.warn('⚠️ Template size calculation failed:', error);
      return 0;
    }
  }

  private calculateStorageSize(): number {
    try {
      const templatesData = localStorage.getItem(this.storageKey);
      const metadataData = localStorage.getItem(this.metadataKey);
      
      const templatesSize = templatesData ? new Blob([templatesData]).size : 0;
      const metadataSize = metadataData ? new Blob([metadataData]).size : 0;
      
      return templatesSize + metadataSize;
      
    } catch (error) {
      console.warn('⚠️ Storage size calculation failed:', error);
      return 0;
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
let storageInstance: LocalTemplateStorage | null = null;

export function getTemplateStorage(): LocalTemplateStorage {
  if (!storageInstance) {
    storageInstance = new LocalTemplateStorage();
  }
  return storageInstance;
}

/**
 * Reset storage instance (for testing)
 */
export function resetTemplateStorage(): void {
  storageInstance = null;
}