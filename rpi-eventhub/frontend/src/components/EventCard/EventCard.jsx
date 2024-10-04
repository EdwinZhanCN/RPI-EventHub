import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './EventCard.module.css';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { DateTime } from 'luxon';

const timeZone = 'America/New_York';

const EventCard = ({ event }) => {
  const { username } = useAuth();
  const { deleteEvent } = useEvents();

  const handleDelete = useCallback(async () => {
    try {
      await deleteEvent(event._id);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }, [event._id, deleteEvent]);

  const formatDateAsEST = (utcDateString) => {
    if (!utcDateString) return "Date not specified";

    const dateTime = DateTime.fromISO(utcDateString, { zone: 'utc' }).setZone(timeZone);
    return dateTime.toFormat('MMMM dd, yyyy');
  };

  const formatTimeAsEST = (utcDateString) => {
    if (!utcDateString) return 'Time not specified';

    const dateTime = DateTime.fromISO(utcDateString, { zone: 'utc' }).setZone(timeZone);
    return dateTime.toFormat('h:mm a');
  };

  const canSeeDeleteButton = (user_name) => {
    return user_name === 'admin' || user_name === event.poster;
  };

  const eventDate = event.startDateTime
    ? formatDateAsEST(event.startDateTime)
    : 'Unavailable';
  
  const eventTime = event.startDateTime
    ? formatTimeAsEST(event.startDateTime)
    : 'Unavailable';

  const [likes, setLikes] = useState(event.likes || 0);
  const [liked, setLiked] = useState(false); // Initially set liked as false

  useEffect(() => {
    // Fetch user information or check user data to determine if the event is liked
    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:5000/events/${event._id}/like/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setLiked(response.data.liked); // Update the liked state based on the server response
      })
      .catch((error) => {
        console.error("Error fetching like status:", error);
      });
  }, [event._id]);

  const handleLikeToggle = async () => {
    const newLikedState = !liked; // Toggle the liked state

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:5000/events/${event._id}/like`,
        { liked: newLikedState }, // Send the new like/unlike state
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setLikes(data.likes); // Update the likes count immediately
        setLiked(newLikedState); // Toggle the liked state
      }
    } catch (error) {
      console.error("Error while toggling like:", error);
    }
  };
  return (
    <div key={event._id} className={styles.eventWrapper}>
      <div className={styles.imageContainer}>
        <img
          src={event.image || 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'}
          loading="lazy"
          alt={event.title}
        />
        <div className={styles.overlay}>
          <Link to={`/events/${event._id}`} className={styles.overlayLink}>
            <span>Open</span>
          </Link>
        </div>
      </div>
      <div className={styles.eventPosterDetails}>
        <p>Posted by {event.poster}</p>
      </div>
      {canSeeDeleteButton(username) && (
        <button onClick={handleDelete} className={styles.deleteButton}>
          Delete
        </button>
      )}
      <div className={styles.eventDetails}>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <p><strong>Date & Time:</strong> {`${eventTime} on ${eventDate}`}</p>
        <p><strong>Location:</strong> {event.location || "Location not specified"}</p>
        <div className={styles.tags}>
          {event.tags && event.tags.length > 0 ? (
            event.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))
          ) : (
            <span className={styles.tag}>No tags available</span>
          )}
        </div>
      </div>
      <div className={styles.likeContainer}>
        <button
          className={`${styles.likeButton} ${liked ? styles.liked : ""}`}
          onClick={handleLikeToggle}
        >
          {likes}
          <span>{liked ? "❤️" : "🤍"}</span>
        </button>
      </div>
    </div>
  );
};

export default EventCard;
