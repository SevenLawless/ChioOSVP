import { useEffect, useRef, useState } from "react";
import {
  createHomeItem,
  deleteHomeItem,
  getHomeItems,
  updateHomeItem,
  uploadHomeImage
} from "../../api/homeApi";
import "./home.css";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";




const emptyForm = {
  title: "",
  content: ""
};

const MIN_ITEM_WIDTH = 180;
const MIN_ITEM_HEIGHT = 120;

function HomePage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState("");
  const [error, setError] = useState("");

  const interactionRef = useRef(null);
  const latestItemsRef = useRef([]);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    function handlePointerMove(event) {
      if (!interactionRef.current) return;

      const interaction = interactionRef.current;
      const canvasRect = canvasRef.current?.getBoundingClientRect();

      if (!canvasRect) return;

      if (interaction.type === "drag") {
        const {
          id,
          startX,
          startY,
          originalX,
          originalY,
          itemWidth,
          itemHeight
        } = interaction;

        const rawX = originalX + event.clientX - startX;
        const rawY = originalY + event.clientY - startY;

        const maxX = Math.max(0, canvasRect.width - itemWidth);
        const maxY = Math.max(0, canvasRect.height - itemHeight);

        const nextX = Math.min(Math.max(0, rawX), maxX);
        const nextY = Math.min(Math.max(0, rawY), maxY);

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  x_position: Math.round(nextX),
                  y_position: Math.round(nextY)
                }
              : item
          )
        );
      }

      if (interaction.type === "resize") {
        const {
          id,
          startX,
          startY,
          originalWidth,
          originalHeight,
          itemX,
          itemY
        } = interaction;

        const rawWidth = originalWidth + event.clientX - startX;
        const rawHeight = originalHeight + event.clientY - startY;

        const maxWidth = Math.max(MIN_ITEM_WIDTH, canvasRect.width - itemX);
        const maxHeight = Math.max(MIN_ITEM_HEIGHT, canvasRect.height - itemY);

        const nextWidth = Math.min(Math.max(MIN_ITEM_WIDTH, rawWidth), maxWidth);
        const nextHeight = Math.min(Math.max(MIN_ITEM_HEIGHT, rawHeight), maxHeight);

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  width: Math.round(nextWidth),
                  height: Math.round(nextHeight)
                }
              : item
          )
        );
      }
    }

    async function handlePointerUp() {
      if (!interactionRef.current) return;

      const { id, type } = interactionRef.current;
      interactionRef.current = null;

      const changedItem = latestItemsRef.current.find((item) => item.id === id);

      if (!changedItem) return;

      try {
        if (type === "drag") {
          await updateHomeItem(id, {
            x_position: changedItem.x_position,
            y_position: changedItem.y_position,
            z_index: changedItem.z_index
          });

          showSavingMessage("Position saved");
        }

        if (type === "resize") {
          await updateHomeItem(id, {
            width: changedItem.width,
            height: changedItem.height
          });

          showSavingMessage("Size saved");
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not save item changes."));
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const data = await getHomeItems();
      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load Home items."));
    } finally {
      setLoading(false);
    }
  }

  function showSavingMessage(message) {
    setSavingMessage(message);

    setTimeout(() => {
      setSavingMessage("");
    }, 1200);
  }

  function openCreateNoteModal() {
    setEditingItem(null);
    setForm(emptyForm);
    setIsNoteModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      title: item.title || "",
      content: item.content || ""
    });
    setIsNoteModalOpen(true);
  }

  function closeNoteModal() {
    setIsNoteModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  async function handleSaveNote(event) {
    event.preventDefault();

    if (!form.title.trim() && !form.content.trim()) {
      setError("Write a title or note content first.");
      return;
    }

    try {
      setError("");

      if (editingItem) {
        const updatedItem = await updateHomeItem(editingItem.id, {
          title: form.title,
          content: form.content
        });

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );

        showSavingMessage("Note updated");
      } else {
        const maxZIndex =
          items.length > 0
            ? Math.max(...items.map((item) => Number(item.z_index || 1)))
            : 1;

        const createdItem = await createHomeItem({
          type: "note",
          title: form.title,
          content: form.content,
          x_position: 140,
          y_position: 120,
          width: 280,
          height: 180,
          z_index: maxZIndex + 1
        });

        setItems((currentItems) => [createdItem, ...currentItems]);
        showSavingMessage("Note created");
      }

      closeNoteModal();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save note."));
    }
  }

  async function handleDeleteItem(itemId) {
    const confirmed = window.confirm("Delete this item?");

    if (!confirmed) return;

    try {
      await deleteHomeItem(itemId);

      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId)
      );

      showSavingMessage("Item deleted");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete item."));
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    try {
      setError("");

      const uploadedItem = await uploadHomeImage(file);

      setItems((currentItems) => [uploadedItem, ...currentItems]);
      showSavingMessage("Image uploaded");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload image. Use a normal image under 5MB."));
    } finally {
      event.target.value = "";
    }
  }

  async function bringItemToFront(item) {
    const maxZIndex =
      items.length > 0
        ? Math.max(...items.map((currentItem) => Number(currentItem.z_index || 1)))
        : 1;

    const nextZIndex = maxZIndex + 1;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              z_index: nextZIndex
            }
          : currentItem
      )
    );

    try {
      await updateHomeItem(item.id, {
        z_index: nextZIndex
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update layer."));
    }
  }

  function startDragging(event, item) {
    if (event.button !== 0) return;

    const maxZIndex =
      items.length > 0
        ? Math.max(...items.map((currentItem) => Number(currentItem.z_index || 1)))
        : 1;

    const nextZIndex = maxZIndex + 1;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              z_index: nextZIndex
            }
          : currentItem
      )
    );

    interactionRef.current = {
      type: "drag",
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: Number(item.x_position),
      originalY: Number(item.y_position),
      itemWidth: Number(item.width),
      itemHeight: Number(item.height)
    };
  }

  function startResizing(event, item) {
    event.stopPropagation();

    interactionRef.current = {
      type: "resize",
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      originalWidth: Number(item.width),
      originalHeight: Number(item.height),
      itemX: Number(item.x_position),
      itemY: Number(item.y_position)
    };
  }

  return (
    <section className="home-page home-page-focused">
      <div className="home-topline">
        <div>
          <p className="eyebrow">Command Center</p>
          <h2>Home</h2>
        </div>

        <div className="home-topline-right">
          {savingMessage && <span className="save-pill">{savingMessage}</span>}
          <span className="canvas-count">{items.length} items</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />

      <div className="canvas-layout">
        <div className="canvas-wrap canvas-wrap-focused">
          <div ref={canvasRef} className="home-canvas">
            {loading && <div className="canvas-empty">Loading your canvas...</div>}

            {!loading && items.length === 0 && (
              <div className="canvas-empty">
                <h3>Your canvas is empty.</h3>
                <p>Add a note or upload an image to start building your space.</p>
              </div>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                className={`canvas-item ${item.type === "image" ? "image-item" : "note-item"}`}
                style={{
                  left: `${item.x_position}px`,
                  top: `${item.y_position}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  zIndex: item.z_index
                }}
                onPointerDown={(event) => startDragging(event, item)}
                onDoubleClick={() => bringItemToFront(item)}
              >
                <div className="item-floating-actions">
                  <button
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => openEditModal(item)}
                  >
                    Edit
                  </button>

                  <button
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>

                {item.type === "image" ? (
                  <div className="image-content">
                    <img src={item.file_path} alt={item.title || "Home upload"} />
                  </div>
                ) : (
                  <div className="note-content">
                    <h4>{item.title || "Untitled note"}</h4>
                    <p>{item.content}</p>
                  </div>
                )}

                <button
                  className="resize-handle"
                  onPointerDown={(event) => startResizing(event, item)}
                  aria-label="Resize item"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="canvas-dock">
          <button
            className="secondary-button dock-button"
            onClick={() => fileInputRef.current.click()}
          >
            Upload image
          </button>

          <button className="primary-button dock-button" onClick={openCreateNoteModal}>
            Add note
          </button>
        </div>
      </div>

      {isNoteModalOpen && (
        <div className="modal-backdrop" onMouseDown={closeNoteModal}>
          <form
            className="note-modal"
            onSubmit={handleSaveNote}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingItem ? "Edit canvas item" : "New canvas note"}
                </p>
                <h3>{editingItem ? "Update item" : "Add note"}</h3>
              </div>

              <button type="button" onClick={closeNoteModal}>
                Close
              </button>
            </div>

            <label>
              Title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value
                  }))
                }
                placeholder="Example: Today’s focus"
              />
            </label>

            {(!editingItem || editingItem.type === "note") && (
              <label>
                Note
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      content: event.target.value
                    }))
                  }
                  placeholder="Write the note..."
                  rows="6"
                />
              </label>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeNoteModal}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default HomePage;
