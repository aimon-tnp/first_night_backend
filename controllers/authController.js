const prisma = require('../config/db');
const supabase = require('../config/supabase');

exports.registerUser = async (req, res) => {
  const { 
    email, password, name, nickname, gender, birthday, 
    telephone, instagram, university, faculty, uni_year,
    mbti, hobbies, quote, love_lang_express, love_lang_receive,
    personality_type, age_preference, ideal_partner_desc,
    emergency_name, emergency_relationship, allergies, medications
  } = req.body;

  try {
    // 1. Create Auth User in Supabase (Admin API)
    // TODO: Call supabase.auth.admin.createUser({ email, password, email_confirm: true })
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // 2. Create Profile in DB using Prisma
    // TODO: Validate that hobbies is an array before inserting
    const newProfile = await prisma.profile.create({
      data: {
        id: newUserId, // Link to Auth ID
        name,
        nickname,
        gender,
        birthday: new Date(birthday), // Ensure Date format
        telephone,
        instagram,
        university,
        faculty,
        uniYear: parseInt(uni_year),
        email, // Optional redundancy
        emergencyName: emergency_name,
        emergencyRelationship: emergency_relationship,
        allergies,
        medications,
        mbti,
        hobbies, // Prisma handles array
        quote,
        loveLangExpress: love_lang_express,
        loveLangReceive: love_lang_receive,
        personalityType: personality_type,
        agePreference: age_preference,
        idealPartnerDesc: ideal_partner_desc
      }
    });

    res.status(201).json({ success: true, userId: newUserId });

  } catch (error) {
    console.error("Register Error:", error);
    // TODO: Add rollback logic (delete auth user if profile creation fails)
    res.status(500).json({ success: false, error: error.message });
  }
};