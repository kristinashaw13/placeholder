console.log('community.js loaded');

// Firebase configuration (PLACEHOLDER for security)
const firebaseConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const postFormContainer = document.getElementById('post-form-container');
const postForm = document.getElementById('community-post-form');
const postTitle = document.getElementById('post-title');
const postContent = document.getElementById('post-content');
const loadingMessage = document.getElementById('loading-message');
const postsList = document.getElementById('posts-list');

// Check auth state and adjust the UI
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user ? user.uid : 'null');
  if (user) {
    postFormContainer.style.display = 'block';
    loadPosts(user);
  } else {
    postFormContainer.style.display = 'none';
    loadingMessage.textContent = 'Please log in to view and post in the community.';
  }
});

// Submit a new post
postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to post.');
    return;
  }

  const title = postTitle.value.trim();
  const content = postContent.value.trim();
  if (!title || !content) {
    alert('Please enter a title and content.');
    return;
  }

  try {
    console.log('Submitting post:', { title, content });
    const docRef = await db.collection('communityPosts').add({
      title,
      content,
      userId: user.uid,
      username: user.email.split('@')[0],
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('Post submitted successfully with ID:', docRef.id);
    postTitle.value = '';
    postContent.value = '';
  } catch (error) {
    console.error('Error submitting post:', error.message);
    alert('Error posting: ' + error.message);
  }
});

// Load and display posts with comments in real-time
function loadPosts(user) {
  console.log('Loading posts for user:', user.uid);
  db.collection('communityPosts')
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      postsList.innerHTML = '';
      if (snapshot.empty) {
        loadingMessage.textContent = 'No posts yet. Be the first!';
        loadingMessage.style.display = 'block';
      } else {
        loadingMessage.style.display = 'none';
        snapshot.forEach((doc) => {
          const post = doc.data();
          const postId = doc.id;
          console.log('Rendering post:', { postId, userId: post.userId });
          const postElement = document.createElement('div');
          postElement.className = 'post';

          let deleteButton = '';
          if (user && post.userId === user.uid) {
            deleteButton = `<button class="delete-post" data-post-id="${postId}">Delete</button>`;
          }

          postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <small>Posted by ${post.username} on ${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</small>
            ${deleteButton}
            <div class="comments" id="comments-${postId}"></div>
            <textarea class="comment-input" id="comment-input-${postId}" placeholder="Add a comment..."></textarea>
            <button class="comment-btn" data-post-id="${postId}">Comment</button>
          `;
          postsList.appendChild(postElement);

          // Load comments for this post
          loadComments(postId);

          // Attach delete listener
          const deleteBtn = postElement.querySelector('.delete-post');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              console.log('Delete button clicked for postId:', postId);
              deletePost(postId, user);
            });
          }

          // Attach comment listener
          const commentBtn = postElement.querySelector('.comment-btn');
          if (commentBtn) {
            commentBtn.addEventListener('click', () => {
              console.log('Comment button clicked for postId:', postId);
              addComment(postId, user);
            });
          }
        });
        console.log('Finished rendering posts, total:', snapshot.size);
      }
    }, (error) => {
      console.error('Error loading posts:', error.message);
      loadingMessage.textContent = 'Error loading posts.';
    });
}

// Load comments for a specific post
function loadComments(postId) {
  const commentsDiv = document.getElementById(`comments-${postId}`);
  db.collection('communityPosts')
    .doc(postId)
    .collection('comments')
    .orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => {
      commentsDiv.innerHTML = '';
      snapshot.forEach((doc) => {
        const comment = doc.data();
        const commentId = doc.id;
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        let deleteCommentButton = '';
        if (auth.currentUser && comment.userId === auth.currentUser.uid) {
          deleteCommentButton = `<button class="delete-comment" data-comment-id="${commentId}" data-post-id="${postId}">Delete</button>`;
        }
        commentElement.innerHTML = `
          <p><em>${comment.username}</em>: ${comment.content}</p>
          <small>${comment.timestamp ? new Date(comment.timestamp.toDate()).toLocaleString() : 'Just now'}</small>
          ${deleteCommentButton}
        `;
        commentsDiv.appendChild(commentElement);

        // Attach delete comment listener
        const deleteCommentBtn = commentElement.querySelector('.delete-comment');
        if (deleteCommentBtn) {
          deleteCommentBtn.addEventListener('click', () => {
            console.log('Delete comment button clicked for commentId:', commentId);
            deleteComment(postId, commentId);
          });
        }
      });
    }, (error) => {
      console.error('Error loading comments for post', postId, ':', error.message);
      commentsDiv.innerHTML = '<p>Error loading comments</p>';
    });
}

// Add a comment to a post
async function addComment(postId, user) {
  if (!user) {
    alert('You must be logged in to comment.');
    return;
  }

  const commentInput = document.getElementById(`comment-input-${postId}`);
  const content = commentInput.value.trim();
  if (!content) {
    alert('Please enter a comment.');
    return;
  }

  try {
    console.log('Adding comment to post:', postId);
    await db.collection('communityPosts')
      .doc(postId)
      .collection('comments')
      .add({
        content,
        userId: user.uid,
        username: user.email.split('@')[0],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    console.log('Comment added successfully');
    commentInput.value = '';
  } catch (error) {
    console.error('Error adding comment:', error.message, error.stack);
    alert('Error commenting: ' + error.message);
  }
}

// Delete a comment
async function deleteComment(postId, commentId) {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to delete a comment.');
    return;
  }

  try {
    const commentRef = db.collection('communityPosts').doc(postId).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      alert('Comment not found.');
      return;
    }

    if (commentDoc.data().userId !== user.uid) {
      alert('You can only delete your own comments.');
      return;
    }

    await commentRef.delete();
    console.log('Comment deleted successfully:', commentId);
  } catch (error) {
    console.error('Error deleting comment:', error.message, error.code);
    alert('Error deleting comment: ' + error.message);
  }
}

// Delete a post
async function deletePost(postId, user) {
  if (!user) {
    alert('You must be logged in to delete a post.');
    return;
  }

  console.log('Attempting to delete post with ID:', postId);
  try {
    const postRef = db.collection('communityPosts').doc(postId);
    const postDoc = await postRef.get();

    console.log('Post exists:', postDoc.exists, 'Data:', postDoc.data());
    if (!postDoc.exists) {
      alert('Post not found.');
      return;
    }

    if (postDoc.data().userId !== user.uid) {
      alert('You can only delete your own posts.');
      return;
    }

    await postRef.delete();
    console.log('Post deleted successfully:', postId);
  } catch (error) {
    console.error('Error deleting post:', error.message, error.code);
    alert('Error deleting post: ' + error.message);
  }
}

// Dropdown toggle with safety check
const dropdownBtn = document.querySelector('.dropdown-btn');
if (dropdownBtn) {
  dropdownBtn.addEventListener('click', () => {
    document.querySelector('.dropdown-menu').classList.toggle('active');
  });
} else {
  console.warn('Dropdown button not found in DOM');
}
