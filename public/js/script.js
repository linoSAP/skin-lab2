// Gestion du panier avec requêtes AJAX
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    initMobileMenu();
    initCartEvents();
});

function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    if (btn) {
        btn.addEventListener('click', function() {
            const nav = document.querySelector('nav');
            nav.classList.toggle('active');
        });
    }
}

function updateCartCount() {
    fetch('/cart/count')
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll('#cart-count').forEach(element => {
                element.textContent = data.count || 0;
            });
        });
}

function initCartEvents() {
    // Ajout au panier
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            e.preventDefault();
            const productId = e.target.getAttribute('data-id');
            
            fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `productId=${productId}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateCartCount();
                    alert('Produit ajouté au panier!');
                }
            });
        }
        
        // Modification de quantité
        if (e.target.classList.contains('quantity-btn') || e.target.classList.contains('remove-btn')) {
            e.preventDefault();
            const itemId = e.target.getAttribute('data-id');
            const action = e.target.classList.contains('minus') ? 'decrease' : 
                          e.target.classList.contains('plus') ? 'increase' : 'remove';
            
            fetch(`/cart/update/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=${action}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                }
            });
        }
    });
    
    // Commande WhatsApp
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            fetch('/cart/order-details')
                .then(response => response.json())
                .then(data => {
                    if (data.items && data.items.length > 0) {
                        let message = "Bonjour, je souhaite passer une commande chez Skin Girl Lab:%0A%0A";
                        
                        data.items.forEach(item => {
                            message += `- ${item.name} (x${item.quantity}) : ${item.total.toLocaleString('fr-FR')} XAF%0A`;
                        });
                        
                        message += `%0ATotal : ${data.total.toLocaleString('fr-FR')} XAF%0A%0AMerci !`;
                        
                        const whatsappNumber = "+237XXXXXXXXX";
                        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                    }
                });
        });
    }
}