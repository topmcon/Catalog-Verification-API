/**
 * Test Type/Department/Family Picklist Sync
 * Tests the new sync endpoints locally before production deployment
 */

const API_KEY = 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd';
const BASE_URL = 'http://localhost:3001';

async function testTypeSync() {
  console.log('\n=== TESTING TYPE PICKLIST SYNC ===\n');
  
  // Test data - small sample Type entries
  const testTypes = [
    { type_id: 'test_type_001', type_name: 'Smart Toilet', category_id: 'cat_toilets' },
    { type_id: 'test_type_002', type_name: 'Wall Mounted Toilet', category_id: 'cat_toilets' },
    { type_id: 'test_type_003', type_name: 'Vessel Sink', category_id: 'cat_sinks' }
  ];
  
  const testDepartments = [
    { department_id: 'dept_bath', department_name: 'Bath' },
    { department_id: 'dept_kitchen', department_name: 'Kitchen' }
  ];
  
  const testFamilies = [
    { family_id: 'fam_plumbing', family_name: 'Plumbing', department_id: 'dept_bath' },
    { family_id: 'fam_fixtures', family_name: 'Fixtures', department_id: 'dept_kitchen' }
  ];
  
  try {
    const response = await fetch(`${BASE_URL}/api/picklists/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        types: testTypes,
        departments: testDepartments,
        families: testFamilies,
        replace_mode: false // Use incremental mode for testing
      })
    });
    
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Type sync SUCCESSFUL!');
      console.log('\nUpdated picklists:');
      result.updated?.forEach(u => {
        console.log(`  - ${u.type}: ${u.previous} → ${u.current} (added: ${u.added}, updated: ${u.updated})`);
      });
    } else {
      console.log('\n❌ Type sync FAILED');
      console.log('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testGetTypes() {
  console.log('\n=== TESTING GET TYPES ENDPOINT ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/picklists/types`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    const types = await response.json();
    
    console.log('Status:', response.status);
    console.log('Total types:', types.length);
    console.log('Sample types:', types.slice(0, 5));
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testGetDepartments() {
  console.log('\n=== TESTING GET DEPARTMENTS ENDPOINT ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/picklists/departments`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    const departments = await response.json();
    
    console.log('Status:', response.status);
    console.log('Total departments:', departments.length);
    console.log('Departments:', departments);
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testGetFamilies() {
  console.log('\n=== TESTING GET FAMILIES ENDPOINT ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/picklists/families`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    const families = await response.json();
    
    console.log('Status:', response.status);
    console.log('Total families:', families.length);
    console.log('Families:', families);
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Type Picklist Sync Tests...\n');
  console.log('⚠️  Make sure local server is running: npm run dev\n');
  
  await testTypeSync();
  await new Promise(r => setTimeout(r, 1000)); // Wait 1 sec
  
  await testGetTypes();
  await new Promise(r => setTimeout(r, 1000));
  
  await testGetDepartments();
  await new Promise(r => setTimeout(r, 1000));
  
  await testGetFamilies();
  
  console.log('\n✅ All tests completed!');
}

runAllTests();
