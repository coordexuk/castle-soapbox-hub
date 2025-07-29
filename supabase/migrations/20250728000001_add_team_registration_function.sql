-- Create a function to handle team registration with transaction
CREATE OR REPLACE FUNCTION public.create_team_registration(
  p_team_name text,
  p_captain_name text,
  p_email text,
  p_phone_number text,
  p_age_range text,
  p_soapbox_name text,
  p_design_description text,
  p_dimensions text,
  p_brakes_steering text,
  p_members jsonb[]
)
RETURNS SETOF team_registrations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
  v_member jsonb;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert team registration
    INSERT INTO public.team_registrations (
      user_id,
      team_name,
      captain_name,
      email,
      phone_number,
      age_range,
      soapbox_name,
      design_description,
      dimensions,
      brakes_steering,
      participants_count,
      status
    ) VALUES (
      v_user_id,
      p_team_name,
      p_captain_name,
      p_email,
      p_phone_number,
      p_age_range,
      p_soapbox_name,
      p_design_description,
      p_dimensions,
      p_brakes_steering,
      array_length(p_members, 1) + 1, -- +1 for captain
      'pending_review'
    )
    RETURNING id INTO v_registration_id;

    -- Add team members
    FOREACH v_member IN ARRAY p_members LOOP
      INSERT INTO public.team_members (
        registration_id,
        member_name,
        member_age,
        email,
        phone,
        is_team_leader
      ) VALUES (
        v_registration_id,
        v_member->>'member_name',
        (v_member->>'member_age')::integer,
        v_member->>'email',
        v_member->>'phone',
        (v_member->>'is_team_leader')::boolean
      );
    END LOOP;

    -- Update participants count
    UPDATE public.team_registrations
    SET participants_count = (
      SELECT COUNT(*) FROM public.team_members
      WHERE registration_id = v_registration_id
    ) + 1 -- +1 for captain
    WHERE id = v_registration_id;

    -- Return the created registration
    RETURN QUERY SELECT * FROM public.team_registrations WHERE id = v_registration_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating team registration: %', SQLERRM;
  END;
END;
$$;
