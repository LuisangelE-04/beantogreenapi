-- Seed a test survey with questions

-- Insert survey
INSERT INTO surveys (name, description, active) 
VALUES ('Physical Experience Feedback', 'August 27 - September 10, 2025', true)
ON CONFLICT DO NOTHING;

-- Get the survey ID (assuming it's the first/only one)
DO $$
DECLARE
  survey_id UUID;
BEGIN
  SELECT id INTO survey_id FROM surveys WHERE name = 'Physical Experience Feedback' LIMIT 1;
  
  IF survey_id IS NOT NULL THEN
    -- Insert questions
    INSERT INTO survey_questions (survey_id, question_order, question_text, question_type, options, is_optional)
    VALUES
      (survey_id, 0, 'How satisfied are you with the coffee waste collection process?', 'multiple-choice', '["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]', false),
      (survey_id, 1, 'How often do you donate coffee grounds?', 'multiple-choice', '["Daily", "Weekly", "Monthly", "Rarely", "Never"]', false),
      (survey_id, 2, 'Would you recommend Bean to Green to others?', 'multiple-choice', '["Definitely", "Probably", "Not Sure", "Probably Not", "Definitely Not"]', false),
      (survey_id, 3, 'Describe your experience using our kiosk. Are there any challenges, perks, or improvements you would suggest?', 'open-ended', NULL, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
