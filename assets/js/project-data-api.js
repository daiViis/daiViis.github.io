class ProjectDataAPI {
    static API_URL = 'https://daiviis.github.io/api/projects.json';
    static cache = null;
    static fetchPromise = null;

    static async fetchProjects(forceRefresh = false) {
        if (this.cache && !forceRefresh) {
            return this.cache;
        }

        if (this.fetchPromise && !forceRefresh) {
            return this.fetchPromise;
        }

        this.fetchPromise = fetch(this.API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Project API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const projects = Array.isArray(data?.projects) ? data.projects : [];
                this.cache = projects;
                return projects;
            })
            .finally(() => {
                this.fetchPromise = null;
            });

        return this.fetchPromise;
    }

    static selectShowcaseProjects(projects) {
        if (!Array.isArray(projects) || projects.length === 0) {
            return { priorityProject: null, otherProjects: [] };
        }

        const priorityProject = projects.find(project => project.priority) || projects[0];
        const otherProjects = projects
            .filter(project => project.id !== priorityProject.id)
            .slice(0, 2);

        return { priorityProject, otherProjects };
    }

    static buildPromptContext(projects) {
        if (!Array.isArray(projects) || projects.length === 0) {
            return '## Live Portfolio Projects\nNo live project data is currently available from the projects API.';
        }

        const sections = projects.map((project, index) => {
            const lines = [`### ${index + 1}. ${project.title || project.id || 'Untitled Project'}`];

            Object.entries(project).forEach(([key, value]) => {
                const formattedValue = this.formatPromptValue(value);
                if (!formattedValue) return;
                lines.push(`- ${this.formatPromptKey(key)}: ${formattedValue}`);
            });

            return lines.join('\n');
        });

        return [
            '## Live Portfolio Projects',
            'Use this live project data as the source of truth when the user asks about portfolio projects currently shown on the site.',
            sections.join('\n\n')
        ].join('\n\n');
    }

    static formatPromptKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, character => character.toUpperCase());
    }

    static formatPromptValue(value) {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        if (Array.isArray(value)) {
            const parts = value
                .map(item => {
                    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                        return String(item);
                    }

                    if (item && typeof item === 'object') {
                        const serialized = Object.entries(item)
                            .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined && itemValue !== '')
                            .map(([itemKey, itemValue]) => `${this.formatPromptKey(itemKey)}: ${itemValue}`)
                            .join(', ');
                        return serialized;
                    }

                    return '';
                })
                .filter(Boolean);

            return parts.join(' | ');
        }

        if (typeof value === 'object') {
            return Object.entries(value)
                .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined && itemValue !== '')
                .map(([itemKey, itemValue]) => `${this.formatPromptKey(itemKey)}: ${itemValue}`)
                .join(', ');
        }

        return String(value);
    }
}

window.ProjectDataAPI = ProjectDataAPI;
