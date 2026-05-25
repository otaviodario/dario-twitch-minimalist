document.addEventListener('DOMContentLoaded', () => {
  const statusBox = document.getElementById('statusBox');
  const redirectBtn = document.getElementById('redirectBtn');
  const autoRedirectToggle = document.getElementById('autoRedirectToggle');
  const langSelect = document.getElementById('langSelect');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  let currentChannel = null;

  // Dicionário de Traduções (PT e EN)
  const translations = {
    pt: {
      title: "Dario Twitch Minimalist",
      detecting: "Detectando canal da Twitch...",
      noChannel: "Nenhum canal ativo detectado.",
      notTwitch: "Você não está no site da Twitch.",
      openChannel: "Abra um canal da Twitch para ativar.",
      btnRedirect: "Ir para CoolTwitch",
      autoRedirect: "Redirecionar automaticamente",
      tabMain: "Controle",
      tabDonate: "Apoiar",
      donateText: "Gostou da extensão? Considere apoiar o projeto com uma contribuição via Wise para ajudar na manutenção e futuras atualizações! Qualquer valor ajuda.",
      donateSub: "Selecione o valor:",
      wise5Btn: "Apoiar com $5.00 USD",
      wise10Btn: "Apoiar com $10.00 USD",
      wiseCustomBtn: "Apoiar com outro valor",
      developedBy: "Desenvolvido por",
      activeChannel: "Canal detectado:"
    },
    en: {
      title: "Dario Twitch Minimalist",
      detecting: "Detecting Twitch channel...",
      noChannel: "No active channel detected.",
      notTwitch: "You are not on Twitch.",
      openChannel: "Open a Twitch channel to activate.",
      btnRedirect: "Go to CoolTwitch",
      autoRedirect: "Auto-redirect",
      tabMain: "Control",
      tabDonate: "Support",
      donateText: "Enjoying the extension? Consider supporting the project with a contribution via Wise to help with maintenance and future updates! Any amount helps.",
      donateSub: "Select amount:",
      wise5Btn: "Support with $5.00 USD",
      wise10Btn: "Support with $10.00 USD",
      wiseCustomBtn: "Support with other amounts",
      developedBy: "Developed by",
      activeChannel: "Channel detected:"
    }
  };

  const reservedPaths = new Set([
    'directory', 'videos', 'moderator', 'settings', 'search', 'p', 'popout', 
    'creator-dashboard', 'subs', 'prime', 'turbo', 'store', 'jobs', 'press', 
    'advertising', 'legal', 'security', 'downloads', 'help', 'team', 'about',
    'blog', 'partner', 'broadcast', 'community'
  ]);

  // Função para aplicar as traduções nos elementos que possuem "data-i18n"
  function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
    
    checkCurrentTabStatus(lang);
  }

  // Verifica o status do canal de acordo com a aba ativa e o idioma selecionado
  function checkCurrentTabStatus(lang) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        if (!tabs || tabs.length === 0) return;
        const activeTab = tabs[0];
        const urlString = activeTab.url;

        if (!urlString) {
          if (statusBox) statusBox.textContent = translations[lang].noChannel;
          return;
        }

        try {
          const url = new URL(urlString);
          const isTwitch = url.hostname === 'twitch.tv' || url.hostname === 'www.twitch.tv';
          
          if (isTwitch) {
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            
            if (pathParts.length > 0) {
              const potentialChannel = pathParts[0].toLowerCase();
              
              if (/^[a-zA-Z0-9_]{4,25}$/.test(potentialChannel) && !reservedPaths.has(potentialChannel)) {
                currentChannel = pathParts[0];
                const prefix = translations[lang].activeChannel || "Channel detected:";
                
                // ALTERADO: Atualização segura do DOM que evita alertas de innerHTML no linter
                if (statusBox) {
                  statusBox.textContent = ''; // Limpa o elemento de forma segura
                  
                  // Adiciona o prefixo traduzido
                  const textPrefix = document.createTextNode(prefix);
                  statusBox.appendChild(textPrefix);
                  
                  // Adiciona quebra de linha
                  statusBox.appendChild(document.createElement('br'));
                  
                  // Adiciona o span com a classe e o nome do canal
                  const channelSpan = document.createElement('span');
                  channelSpan.className = 'channel-name';
                  channelSpan.textContent = currentChannel;
                  statusBox.appendChild(channelSpan);
                }
                
                if (redirectBtn) redirectBtn.disabled = false;
              } else {
                if (statusBox) statusBox.textContent = translations[lang].noChannel;
              }
            } else {
              if (statusBox) statusBox.textContent = translations[lang].openChannel;
            }
          } else {
            if (statusBox) statusBox.textContent = translations[lang].notTwitch;
          }
        } catch (e) {
          if (statusBox) statusBox.textContent = "Error parsing URL";
        }
      });
    } catch (err) {
      console.error("Erro ao ler abas:", err);
    }
  }

  // Inicializa o estado das configurações do armazenamento (storage)
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['lang', 'autoRedirect'], (data) => {
      if (autoRedirectToggle) {
        autoRedirectToggle.checked = !!data.autoRedirect;
      }

      let selectedLang = data.lang;
      if (!selectedLang) {
        selectedLang = 'en';
      }
      if (langSelect) {
        langSelect.value = selectedLang;
      }
      applyTranslations(selectedLang);
    });
  } else {
    applyTranslations('en');
  }

  // Evento de alteração de idioma no select dropdown
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      const newLang = langSelect.value;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ lang: newLang }, () => {
          applyTranslations(newLang);
        });
      } else {
        applyTranslations(newLang);
      }
    });
  }

  // Evento de alternação do interruptor de redirect automático
  if (autoRedirectToggle) {
    autoRedirectToggle.addEventListener('change', () => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ autoRedirect: autoRedirectToggle.checked });
      }
    });
  }

  // Evento do botão de redirecionamento manual
  if (redirectBtn) {
    redirectBtn.addEventListener('click', () => {
      if (currentChannel) {
        const coolTwitchUrl = `https://api.roaringiron.com/cooltwitch/?channel=${currentChannel}`;
        chrome.tabs.update({ url: coolTwitchUrl });
        window.close();
      }
    });
  }

  // Navegação de Abas (Controle / Apoiar)
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
});