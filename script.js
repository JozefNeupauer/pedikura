const fadeItems = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

fadeItems.forEach((item) => observer.observe(item));

const bookingDateInput = document.getElementById('bookingDate');
const timeSlotsContainer = document.getElementById('timeSlots');
const bookingForm = document.getElementById('bookingForm');
const selectedTimeInput = document.getElementById('selectedTime');
const bookingFeedback = document.getElementById('bookingFeedback');

const emailjsConfig = {
  publicKey: 'DOPLN_PUBLIC_KEY',
  serviceId: 'DOPLN_SERVICE_ID',
  templateId: 'DOPLN_TEMPLATE_ID',
  toEmail: 'DOPLN_OSOBNY_GMAIL@gmail.com',
};

function isEmailjsConfigured() {
  return (
    emailjsConfig.publicKey !== 'DOPLN_PUBLIC_KEY' &&
    emailjsConfig.serviceId !== 'DOPLN_SERVICE_ID' &&
    emailjsConfig.templateId !== 'DOPLN_TEMPLATE_ID' &&
    emailjsConfig.toEmail !== 'DOPLN_OSOBNY_GMAIL@gmail.com'
  );
}

async function sendReservationEmail(payload) {
  if (!window.emailjs) {
    throw new Error('EmailJS kniznica sa nenasla.');
  }

  emailjs.init({
    publicKey: emailjsConfig.publicKey,
  });

  return emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
    to_email: emailjsConfig.toEmail,
    full_name: payload.fullName,
    contact: payload.contact,
    service: payload.service,
    date: payload.date,
    time: payload.time,
    message: `Nova rezervacia: ${payload.service} | ${payload.date} | ${payload.time}`,
  });
}

if (bookingDateInput && timeSlotsContainer && bookingForm && selectedTimeInput && bookingFeedback) {
  const dailySlots = ['08:30', '09:30', '10:30', '12:00', '13:00', '14:00', '15:30', '16:30', '17:30'];

  const bookedByDate = {
    '2026-04-03': ['09:30', '14:00'],
    '2026-04-04': ['10:30', '12:00', '16:30'],
    '2026-04-05': ['08:30', '15:30'],
  };

  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  bookingDateInput.min = todayISO;
  bookingDateInput.value = todayISO;

  function renderSlots(dateValue) {
    const bookedSlots = bookedByDate[dateValue] || [];
    timeSlotsContainer.innerHTML = '';

    dailySlots.forEach((time) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot-btn';
      button.textContent = time;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');

      if (bookedSlots.includes(time)) {
        button.classList.add('booked');
        button.disabled = true;
      }

      button.addEventListener('click', () => {
        document.querySelectorAll('.slot-btn').forEach((btn) => {
          btn.classList.remove('selected');
          btn.setAttribute('aria-checked', 'false');
        });

        button.classList.add('selected');
        button.setAttribute('aria-checked', 'true');
        selectedTimeInput.value = time;
        bookingFeedback.textContent = `Vybraný čas: ${time}`;
        bookingFeedback.className = 'booking-feedback';
      });

      timeSlotsContainer.appendChild(button);
    });

    selectedTimeInput.value = '';
  }

  renderSlots(bookingDateInput.value);

  bookingDateInput.addEventListener('change', (event) => {
    renderSlots(event.target.value);
    bookingFeedback.textContent = '';
    bookingFeedback.className = 'booking-feedback';
  });

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const service = document.getElementById('service').value;
    const date = bookingDateInput.value;
    const time = selectedTimeInput.value;

    if (!fullName || !contact || !service || !date || !time) {
      bookingFeedback.textContent = 'Prosím vyplňte všetky polia a vyberte čas.';
      bookingFeedback.className = 'booking-feedback error';
      return;
    }

    if (!isEmailjsConfigured()) {
      bookingFeedback.textContent =
        'Doplňte EmailJS údaje v script.js: publicKey, serviceId, templateId a toEmail.';
      bookingFeedback.className = 'booking-feedback error';
      return;
    }

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Odosielam rezerváciu...';

    try {
      await sendReservationEmail({ fullName, contact, service, date, time });
    } catch (error) {
      bookingFeedback.textContent =
        'Rezerváciu sa nepodarilo odoslať. Skontrolujte EmailJS nastavenia a skúste znova.';
      bookingFeedback.className = 'booking-feedback error';
      submitButton.disabled = false;
      submitButton.textContent = 'Potvrdiť rezerváciu';
      return;
    }

    if (!bookedByDate[date]) {
      bookedByDate[date] = [];
    }
    bookedByDate[date].push(time);

    bookingFeedback.textContent = `Ďakujeme, ${fullName}. Rezervácia pre službu ${service} na ${date} o ${time} bola potvrdená.`;
    bookingFeedback.className = 'booking-feedback success';

    bookingForm.reset();
    bookingDateInput.value = date;
    renderSlots(date);

    submitButton.disabled = false;
    submitButton.textContent = 'Potvrdiť rezerváciu';
  });
}
