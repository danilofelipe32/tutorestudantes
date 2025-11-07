const CACHE_NAME = 'tutor-ia-cache-v2';
// Adiciona os recursos essenciais do "app shell" que devem estar disponíveis offline desde o início.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json',
  // Arquivos principais da aplicação
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  // Todos os componentes, dados e serviços para garantir a navegação básica
  '/data/subjects.ts',
  '/components/Icons.tsx',
  '/components/SubjectList.tsx',
  '/components/SubjectDetail.tsx',
  '/components/Exercise.tsx',
  '/components/TutorChat.tsx',
  '/components/StudySession.tsx',
  '/components/ChatHistory.tsx',
  '/services/learningService.ts',
  '/services/chatHistoryService.ts',
  '/services/notificationService.ts',
  // O serviço gemini é necessário mesmo offline para conter a lógica de fallback
  '/services/geminiService.ts'
];

// Instala o service worker e armazena em cache o app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Limpa caches antigos durante a ativação.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // Tenta encontrar a resposta no cache.
    caches.match(event.request)
      .then(response => {
        // Se uma resposta for encontrada, a retorna.
        if (response) {
          return response;
        }

        // Se a requisição não estiver no cache, busca na rede.
        return fetch(event.request).then(
          networkResponse => {
            // Verifica se recebemos uma resposta válida.
            // Não armazena em cache as chamadas para a API do Gemini.
            if (
              !networkResponse || 
              networkResponse.status !== 200 ||
              event.request.url.includes('generativelanguage.googleapis.com')
            ) {
              return networkResponse;
            }

            // Clona a resposta porque é uma stream e só pode ser consumida uma vez.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Armazena a nova resposta em cache para uso futuro.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            // Em caso de falha na rede, o app offline ainda tentará servir do cache.
            // Se não estiver no cache e a rede falhar, o erro será propagado.
            console.error('Falha no fetch:', error);
            throw error;
        });
      })
  );
});
