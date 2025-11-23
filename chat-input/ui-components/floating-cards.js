export const floatingCardsHTML = `
    <!-- Floating cards container - cards spawn dynamically from template -->
    <div id="floatingCardsContainer"></div>

    <!-- Floating Cards Manager - shows above chat input like attachments -->
    <div class="floating-cards-manager" id="floatingCardsManager" style="display: none;">
        <div class="cards-manager-section" id="cardsManagerSection">
            <div class="cards-manager-header">
                <span class="cards-manager-title"></span>
                <div class="cards-manager-actions">
                    <button class="card-manager-btn" id="showAllCardsBtn" title="Show all cards">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Show All
                    </button>
                    <button class="card-manager-btn" id="hideAllCardsBtn" title="Hide all cards">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                        Hide All
                    </button>
                </div>
            </div>
            <div class="cards-grid" id="cardsGrid">
                <!-- Card previews will be added here dynamically -->
            </div>
        </div>
    </div>
`;

