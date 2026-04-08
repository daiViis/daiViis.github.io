document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('projects-container');
    if (!container) return;

    try {
        const projects = await window.ProjectDataAPI.fetchProjects();

        if (projects.length > 0) {
            const { priorityProject, otherProjects } = window.ProjectDataAPI.selectShowcaseProjects(projects);
            renderProjects(priorityProject, otherProjects);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        showErrorState();
    }

    function renderProjects(hero, others) {
        container.innerHTML = '';
        container.className = 'space-y-4';

        if (!hero) {
            showEmptyState();
            return;
        }

        container.appendChild(createHeroCard(hero));

        if (others.length > 0) {
            const othersLabel = document.createElement('div');
            othersLabel.className = 'flex items-center gap-4 pt-2 pb-1';
            othersLabel.innerHTML = `
                <span class='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400'>Latest Releases</span>
                <div class='h-px flex-grow bg-gray-100'></div>
            `;
            container.appendChild(othersLabel);

            others.forEach(project => {
                container.appendChild(createCompactCard(project));
            });
        }
    }

    function getProjectColor(projectId) {
        const colors = {
            'svj-finder': '#2563eb',
            'feign-tracker': '#ef4444',
            'codepulse': '#8b5cf6',
        };
        return colors[projectId] || '#000000';
    }

    function createHeroCard(project) {
        const card = document.createElement('div');
        const accentColor = getProjectColor(project.id);
        card.className = 'group relative bg-black rounded-3xl p-8 lg:p-12 overflow-hidden transition-all duration-700 hover:scale-[1.01] hover:shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[350px] flex flex-col justify-between border border-white/5';

        const tagsHtml = renderTags(project.tags);
        const imageSrc = project.image || project.icon;
        const actionUrl = project.appUrl || project.githubUrl || project.url;
        const placeholderSvg = `<svg class='w-8 h-8 text-white/20' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 11v10l8 4'></path></svg>`;

        card.innerHTML = `
            <div class='absolute inset-0 z-0 opacity-20' style='background-image: radial-gradient(white 1px, transparent 1px); background-size: 24px 24px;'></div>

            ${imageSrc ? `
                <div class='absolute -right-20 -top-20 w-80 h-80 opacity-40 blur-[120px] rounded-full transition-all duration-700 group-hover:opacity-60 group-hover:scale-110'
                     style='background: ${accentColor};'></div>
            ` : ''}

            <div class='relative z-10 flex items-start justify-between'>
                <div class='w-20 h-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-white/20 transition-all duration-500 overflow-hidden'>
                    ${imageSrc ? `<img src='${imageSrc}' alt='' class='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500' onerror="this.parentElement.innerHTML='${placeholderSvg}'">` : placeholderSvg}
                </div>
                <div class='text-right'>
                    <span class='px-3 py-1 bg-white/10 backdrop-blur-md text-white/40 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-white/5'>Featured Project</span>
                    <div class='flex gap-2 mt-4 justify-end'>${tagsHtml}</div>
                </div>
            </div>

            <div class='relative z-10 mt-12'>
                <h4 class='text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tighter'>${project.title}</h4>
                <p class='text-gray-400 text-base leading-relaxed mb-10 max-w-lg'>${project.description}</p>

                <div class='flex items-center justify-between pt-6 border-t border-white/5'>
                    <a href='${project.url}' target='_blank' class='text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2'>
                        Explore Documentation
                        <svg class='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path d='M9 5l7 7-7 7' stroke-width='2'></path></svg>
                    </a>
                    <a href='${actionUrl}' target='_blank'
                       onmouseover="this.style.backgroundColor='${accentColor}'; this.style.color='white'"
                       onmouseout="this.style.backgroundColor='white'; this.style.color='black'"
                       class='group/btn px-6 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-300 transform active:scale-95'>
                        Launch App
                        <svg class='w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M14 5l7 7m0 0l-7 7m7-7H3'></path></svg>
                    </a>
                </div>
            </div>
        `;
        return card;
    }

    function createCompactCard(project) {
        const card = document.createElement('div');
        const accentColor = getProjectColor(project.id);
        card.className = 'group bg-white border border-gray-100 rounded-xl p-4 transition-all duration-300 hover:border-black hover:shadow-lg';

        const tagsHtml = renderTags(project.tags);
        const imageSrc = project.icon || project.image;
        const actionUrl = project.appUrl || project.githubUrl || project.url;
        const placeholderSvg = `<svg class='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 11v10l8 4'></path></svg>`;

        card.innerHTML = `
            <div class='flex items-center gap-4'>
                <div class='flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden'>
                    ${imageSrc ? `<img src='${imageSrc}' alt='' class='w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all' onerror="this.parentElement.innerHTML='${placeholderSvg}'">` : placeholderSvg}
                </div>
                <div class='flex-grow min-w-0'>
                    <div class='flex items-center justify-between mb-0.5'>
                        <h5 class='text-sm font-bold text-black truncate'>${project.title}</h5>
                        <div class='flex gap-1'>${tagsHtml}</div>
                    </div>
                    <p class='text-[11px] text-gray-500 line-clamp-1'>${project.description}</p>
                </div>
                <a href='${actionUrl}' target='_blank'
                   onmouseover="this.style.backgroundColor='${accentColor}'; this.style.color='white'; this.style.borderColor='${accentColor}'"
                   onmouseout="this.style.backgroundColor='transparent'; this.style.color='#9ca3af'; this.style.borderColor='#f3f4f6'"
                   class='flex-shrink-0 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all'>
                    <svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M14 5l7 7m0 0l-7 7m7-7H3'></path></svg>
                </a>
            </div>
        `;
        return card;
    }

    function renderTags(tags) {
        if (!tags || tags.length === 0) return '';
        return tags
            .filter(tag => tag.toLowerCase() !== 'vibe coded')
            .map(tag => `<span class='px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-black uppercase tracking-wider rounded-md'>${tag}</span>`)
            .join(' ');
    }

    function showEmptyState() {
        container.innerHTML = `<p class='text-[11px] text-gray-400 italic text-center p-8'>Exploring new horizons...</p>`;
    }

    function showErrorState() {
        container.innerHTML = `<div class='bg-red-50 rounded-xl p-4 border border-red-100 text-center'><p class='text-[11px] text-red-500'>Connection to repository lost.</p></div>`;
    }
});
