// ... existing code ...
                            <select
                                onChange={(e)=> setExperience(e.target.value) }
                                value={experience}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                name="experience"
                                id="experience"
                            >
                                {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i} value={`${i + 1} Year`}>
                                        {i + 1} Year
                                    </option>
                                ))}
                            </select>
// ... existing code ...
                            <select
                                onChange={(e)=> setSpeciality(e.target.value) }
                                value={speciality}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                name="speciality"
                                id="speciality"
                            >
                                <option value="General Physician">General Physician</option>
                                <option value="Pediatrician">Pediatrician</option>
                                <option value="Gynecologist">Gynecologist</option>
                                <option value="Dermatologist">Dermatologist</option>
                                <option value="ENT Specialist">ENT Specialist</option>
                                <option value="Ophthalmologist">Ophthalmologist</option>
                                <option value="Dentist">Dentist</option>
                                <option value="Cardiologist">Cardiologist</option>
                                <option value="Neurologist">Neurologist</option>
                                <option value="Gastroenterologist">Gastroenterologist</option>
                                <option value="Nephrologist">Nephrologist</option>
                                <option value="Endocrinologist">Endocrinologist</option>
                                <option value="Pulmonologist">Pulmonologist</option>
                                <option value="General Surgeon">General Surgeon</option>
                                <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                                <option value="Urologist">Urologist</option>
                                <option value="Psychiatrist">Psychiatrist</option>
                                <option value="Oncologist">Oncologist</option>
                                <option value="Rheumatologist">Rheumatologist</option>
                                <option value="Infectious Disease Specialist">Infectious Disease Specialist</option>
                            </select>
// ... existing code ...