const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.feature, .panel, .trust-grid > div').forEach((el) => {
  el.classList.add('reveal');
  observer.observe(el);
});
