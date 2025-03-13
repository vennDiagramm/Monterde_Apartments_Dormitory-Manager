// Update the Date daily
function updateDate() {
    const dateElement = document.querySelector('.date');
    const today = new Date();
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    
    dateElement.textContent = formattedDate;
  }
    
  updateDate();
  // End of Date Function

// Change Background Image
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slide");
  let currentSlide = 0;

  function changeSlide() {
      // Remove 'active' from current slide
      slides[currentSlide].classList.remove("active");

      // Move to the next slide or loop back to the first
      currentSlide = (currentSlide + 1) % slides.length;

      // Add 'active' to new slide
      slides[currentSlide].classList.add("active");
  }

  // Change slide every 5 seconds
  setInterval(changeSlide, 6000);
});
