import express from "express";
import multer from "multer";
import fs from "fs";
import Form from "../models/Form.js";
import path from "path";

const router = express.Router();

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// FIX: Important - Add file filter to handle all file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// ---------------- CORS Headers ----------------
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ---------------- Serve Uploads ----------------
router.use("/files", express.static("uploads"));

// ---------------- GET /api/upload ----------------
router.get("/", async (req, res) => {
  try {
    const forms = await Form.find();
    console.log("Found forms:", forms.length);

    const formsWithUrl = forms.map((f) => {
      const formObj = f.toObject();
      console.log(`Form ${formObj._id} - Hobbies:`, formObj.hobbies, "Resume:", formObj.resume);
      
      return {
        ...formObj,
        resumeUrl: formObj.resume
          ? `/api/upload/files/${formObj.resume}`
          : null,
      };
    });

    res.json(formsWithUrl);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    return res.status(500).json({
      error: "Server error while fetching forms",
      details: err.message,
    });
  }
});

// ---------------- DELETE /api/upload/:id ----------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedForm = await Form.findByIdAndDelete(id);

    if (!deletedForm) return res.status(404).json({ error: "Form not found" });

    if (deletedForm.resume && fs.existsSync(`uploads/${deletedForm.resume}`)) {
      fs.unlinkSync(`uploads/${deletedForm.resume}`);
    }

    res.json({ success: true, message: "Form deleted successfully!" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({
      error: "Server error while deleting form",
      details: err.message,
    });
  }
});

// ---------------- PUT /api/upload/:id ----------------
router.put("/:id", upload.single("resume"), async (req, res) => {
  try {
    const { id } = req.params;
    console.log("=== UPDATE REQUEST ===");
    console.log("Body fields:", Object.keys(req.body));
    console.log("All body content:", req.body);
    console.log("File:", req.file);

    // FIX: Handle hobbies - multer puts multiple fields with same name into array
    let hobbies = req.body.hobbies || [];
    
    // If it's a string, convert to array
    if (typeof hobbies === 'string') {
      hobbies = [hobbies];
    }
    
    console.log("Final hobbies array:", hobbies);

    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: "Form not found" });

    // Handle resume file
    if (req.file) {
      console.log("New file uploaded:", req.file.filename);
      if (form.resume && fs.existsSync(`uploads/${form.resume}`)) {
        fs.unlinkSync(`uploads/${form.resume}`);
      }
      form.resume = req.file.filename;
    }

    // Update fields
    form.fullName = req.body.fullName;
    form.email = req.body.email;
    form.contact = req.body.contact;
    form.gender = req.body.gender;
    form.subject = req.body.subject;
    form.about = req.body.about;
    form.password = req.body.password;
    form.hobbies = hobbies;

    await form.save();

    const response = {
      ...form.toObject(),
      resumeUrl: form.resume ? `/api/upload/files/${form.resume}` : null,
    };

    console.log("Update successful. Response:", response);
    res.json(response);
    
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({
      error: "Server error while updating form",
      details: err.message,
    });
  }
});

// ---------------- POST /api/upload ----------------
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    console.log("=== POST REQUEST ===");
    console.log("Body fields:", Object.keys(req.body));
    console.log("Full body:", req.body);
    console.log("Uploaded file:", req.file);

    // FIX: Handle hobbies - this is the key fix
    let hobbies = req.body.hobbies || [];
    
    // If hobbies is a string (single selection), convert to array
    if (typeof hobbies === 'string') {
      hobbies = [hobbies];
    }
    
    // If it's already an array, use it as is (multiple selections)
    console.log("Processed hobbies:", hobbies);

    const newForm = new Form({
      fullName: req.body.fullName,
      email: req.body.email,
      contact: req.body.contact,
      gender: req.body.gender,
      subject: req.body.subject,
      about: req.body.about,
      password: req.body.password,
      hobbies: hobbies,
      resume: req.file ? req.file.filename : null,
    });

    const savedForm = await newForm.save();
    console.log("SAVED TO DATABASE - Hobbies:", savedForm.hobbies, "Resume:", savedForm.resume);

    const response = {
      ...savedForm.toObject(),
      resumeUrl: savedForm.resume ? `/api/upload/files/${savedForm.resume}` : null,
    };

    console.log("Sending response to frontend:", response);
    res.json(response);
    
  } catch (err) {
    console.error("POST ERROR:", err);
    return res.status(500).json({
      error: "Server error while submitting form",
      details: err.message,
    });
  }
});

export default router;