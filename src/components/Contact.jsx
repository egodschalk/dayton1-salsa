import { Link, useLocation } from 'react-router-dom';
import './Contact.css'
import Swal from 'sweetalert2'

function Contact() {

    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);

        formData.append("access_key", "6602dfd9-8679-4b6d-a590-dbfa355d233a");

        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: json
        }).then((res) => res.json());

        if (res.success) {
            Swal.fire({
                title: "Thank you!",
                text: "Your message has been sent",
                icon: "success"
            });
        }
    };



    return (
        <div className="contact-page" id='Contact'>
            <h2 className="contact-header">Contact Us</h2>
            <div className='contact-content'>
                <div className='contact-info'>
                    <h3>Address:</h3>
                    <p>The Galleria Event Center</p>
                    <p>4140 Linden Ave</p>
                    <p>Dayton, OH 45432</p>
                    <h3>Phone (Please Text):</h3>
                    <p>858-752-2578</p>
                    <h3>Email:</h3>
                    <p>DaytOn1Salsa@gmail.com</p>
                </div>
                <div className='contact-form'>
                    <form onSubmit={onSubmit} className='form'>
                        <div className='field'>
                            <label className='label'>
                                <input type="text" className="name" name="name" placeholder="name" required />
                            </label>
                        </div>
                        <div className='field'>
                            <label className='label'>
                                <input type="text" className="email" name="email" placeholder="email" required />
                            </label>
                        </div>
                        <div className='field'>
                            <label className='label'>
                                <input type="text" className="phone" name="phone" placeholder="phone" required />
                            </label>
                        </div>
                        <div className='field'>
                            <label className='label-message'>
                                <textarea className="message" name='message' placeholder="your message" required></textarea>
                            </label>
                        </div>
                        <button type='submit'>Send Message</button>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default Contact;